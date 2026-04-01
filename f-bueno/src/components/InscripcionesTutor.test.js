import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InscripcionesTutor from "./InscripcionesTutor";

// Guardamos fetch original
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function mockFetchInscripcionesOnce(inscripciones = []) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ok: true,
      inscripciones,
    }),
  });
}

test("muestra mensaje cuando no hay inscripciones", async () => {
  mockFetchInscripcionesOnce([]);

  render(
    <InscripcionesTutor tutorId={1} token="fake-token" version={0} />
  );

  expect(
    await screen.findByText(/No hay inscripciones registradas/i)
  ).toBeInTheDocument();
});

test("renderiza inscripciones con diferentes estados y badges", async () => {
  mockFetchInscripcionesOnce([
    {
      id: 1,
      participante_nombre: "Ana",
      participante_apellido: "López",
      fecha_nacimiento: "2015-05-10",
      taller: "Taller 1",
      fecha_inicio: "2026-07-01",
      fecha_fin: "2026-07-10",
      fecha_inscripcion: "2026-06-01",
      estado: "pendiente",
    },
    {
      id: 2,
      participante_nombre: "Juan",
      participante_apellido: "Pérez",
      fecha_nacimiento: "2014-03-20",
      taller: "Taller 2",
      fecha_inicio: "2026-07-05",
      fecha_fin: "2026-07-15",
      fecha_inscripcion: "2026-06-02",
      estado: "pagado",
    },
    {
      id: 3,
      participante_nombre: "Marta",
      participante_apellido: "García",
      fecha_nacimiento: "2013-01-01",
      taller: "Taller 3",
      fecha_inicio: "2026-07-10",
      fecha_fin: "2026-07-20",
      fecha_inscripcion: "2026-06-03",
      estado: "cancelada",
    },
  ]);

  render(
    <InscripcionesTutor tutorId={1} token="fake-token" version={0} />
  );

  // Esperar a que se carguen
  await screen.findByText(/Ana López/);

  // Comprobar que aparecen los tres participantes
  expect(screen.getByText(/Ana López/)).toBeInTheDocument();
  expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
  expect(screen.getByText(/Marta García/)).toBeInTheDocument();

  // Comprobar badges de estado por texto
  expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  expect(screen.getByText(/Pagado/i)).toBeInTheDocument();
  expect(screen.getByText(/Cancelada/i)).toBeInTheDocument();
});

test("al cancelar una inscripción se actualiza el estado a Cancelada", async () => {
  // 1er fetch: carga inicial de inscripciones
  mockFetchInscripcionesOnce([
    {
      id: 1,
      participante_nombre: "Ana",
      participante_apellido: "López",
      fecha_nacimiento: "2015-05-10",
      taller: "Taller 1",
      fecha_inicio: "2026-07-01",
      fecha_fin: "2026-07-10",
      fecha_inscripcion: "2026-06-01",
      estado: "pendiente",
    },
  ]);

  // 2º fetch: respuesta de PUT /cancelar
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, message: "Inscripción cancelada correctamente" }),
  });

  // Mock de window.confirm para que devuelva true
  const originalConfirm = window.confirm;
  window.confirm = jest.fn(() => true);

  render(
    <InscripcionesTutor tutorId={1} token="fake-token" version={0} />
  );

  await screen.findByText(/Ana López/);

  const cancelarButton = screen.getByRole("button", { name: /Cancelar/i });
  fireEvent.click(cancelarButton);

  await waitFor(() => {
    // El texto "Cancelada" debe estar en la tabla
    expect(screen.getByText(/Cancelada/i)).toBeInTheDocument();
  });

  // Restaurar confirm
  window.confirm = originalConfirm;
});

test("al marcar como pagada una inscripción se actualiza el estado a Pagado", async () => {
  // 1er fetch: carga inicial
  mockFetchInscripcionesOnce([
    {
      id: 1,
      participante_nombre: "Ana",
      participante_apellido: "López",
      fecha_nacimiento: "2015-05-10",
      taller: "Taller 1",
      fecha_inicio: "2026-07-01",
      fecha_fin: "2026-07-10",
      fecha_inscripcion: "2026-06-01",
      estado: "pendiente",
      monto: 50,
    },
  ]);

  // 2º fetch: PUT /pagar
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, message: "Inscripción marcada y pago registrado." }),
  });

  render(
    <InscripcionesTutor tutorId={1} token="fake-token" version={0} />
  );

  await screen.findByText(/Ana López/);

  const pagarButton = screen.getByRole("button", { name: /Pagar/i });
  fireEvent.click(pagarButton);

  await waitFor(() => {
    expect(screen.getByText(/Pagado/i)).toBeInTheDocument();
  });
});
