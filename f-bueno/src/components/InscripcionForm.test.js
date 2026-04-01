import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InscripcionForm from "./InscripcionForm";

// Guardamos el fetch original para restaurarlo después
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

// Mock de la carga inicial de talleres (GET /api/talleres)
function mockFetchTalleresOnce() {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ok: true,
      talleres: [
        { id: 1, nombre: "Taller 1", cupo_maximo: 20, ocupadas: 0 },
      ],
    }),
  });
}

function getInputs() {
  const nombreLabel = screen.getByText("Nombre del participante");
  const apellidoLabel = screen.getByText("Apellido del participante");
  const fechaLabel = screen.getByText("Fecha de nacimiento");
  // Para evitar conflicto con las <option> que también contienen "Taller",
  // buscamos exactamente el label con ese texto.
  const tallerLabel = screen.getByText((content, element) => {
    return (
      element.tagName.toLowerCase() === "label" &&
      content === "Taller"
    );
  });

  const nombreInput = nombreLabel.parentElement.querySelector("input");
  const apellidoInput = apellidoLabel.parentElement.querySelector("input");
  const fechaInput = fechaLabel.parentElement.querySelector("input");
  const tallerSelect = tallerLabel.parentElement.querySelector("select");

  return { nombreInput, apellidoInput, fechaInput, tallerSelect };
}

test("renderiza los campos básicos del formulario de inscripción", async () => {
  mockFetchTalleresOnce();

  render(<InscripcionForm tutorId={1} onInscripcionCreada={jest.fn()} />);

  // Esperamos a que aparezca el taller cargado por fetch
  await screen.findByText(/Taller 1/i);

  const { nombreInput, apellidoInput, fechaInput, tallerSelect } = getInputs();

  expect(nombreInput).toBeInTheDocument();
  expect(apellidoInput).toBeInTheDocument();
  expect(fechaInput).toBeInTheDocument();
  expect(tallerSelect).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Inscribir/i })
  ).toBeInTheDocument();
});

test("no permite enviar el formulario con fecha de nacimiento futura (validación en cliente)", async () => {
  mockFetchTalleresOnce();

  render(<InscripcionForm tutorId={1} onInscripcionCreada={jest.fn()} />);

  await screen.findByText(/Taller 1/i);

  const { nombreInput, apellidoInput, fechaInput, tallerSelect } = getInputs();
  const submitButton = screen.getByRole("button", { name: /Inscribir/i });

  fireEvent.change(nombreInput, { target: { value: "Juan" } });
  fireEvent.change(apellidoInput, { target: { value: "Pérez" } });
  // Fecha claramente futura
  fireEvent.change(fechaInput, { target: { value: "2100-01-01" } });
  fireEvent.change(tallerSelect, { target: { value: "1" } });

  fireEvent.click(submitButton);

  expect(
    await screen.findByText(/La fecha de nacimiento no puede ser posterior a hoy/i)
  ).toBeInTheDocument();

  // Solo debe haberse llamado al fetch de carga de talleres, no al POST de inscripción
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("llama a onInscripcionCreada tras inscripción correcta y limpia el formulario", async () => {
  // 1er fetch: carga de talleres en useEffect
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        talleres: [
          { id: 1, nombre: "Taller 1", cupo_maximo: 20, ocupadas: 0 },
        ],
      }),
    })
    // 2º fetch: POST /api/inscripciones
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, message: "Inscripción realizada" }),
    })
    // 3er fetch: recarga de talleres tras inscripción
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        talleres: [
          { id: 1, nombre: "Taller 1", cupo_maximo: 20, ocupadas: 1 },
        ],
      }),
    });

  const onInscripcionCreada = jest.fn();

  render(<InscripcionForm tutorId={123} onInscripcionCreada={onInscripcionCreada} />);

  await screen.findByText(/Taller 1/i);

  const { nombreInput, apellidoInput, fechaInput, tallerSelect } = getInputs();
  const submitButton = screen.getByRole("button", { name: /Inscribir/i });

  fireEvent.change(nombreInput, { target: { value: "Ana" } });
  fireEvent.change(apellidoInput, { target: { value: "López" } });
  fireEvent.change(fechaInput, { target: { value: "2015-05-10" } });
  fireEvent.change(tallerSelect, { target: { value: "1" } });

  fireEvent.click(submitButton);

  await waitFor(() =>
    expect(onInscripcionCreada).toHaveBeenCalledWith({
      participante_nombre: "Ana",
      participante_apellido: "López",
      fecha_nacimiento: "2015-05-10",
      taller_id: "1",
    })
  );

  // Comprobar que el formulario se ha limpiado
  expect(nombreInput).toHaveValue("");
  expect(apellidoInput).toHaveValue("");
  expect(fechaInput).toHaveValue("");
  expect(tallerSelect).toHaveValue("");

  // Debe haberse llamado 3 veces a fetch:
  // 1: GET talleres inicial, 2: POST inscripciones, 3: GET talleres tras inscripción
  expect(global.fetch).toHaveBeenCalledTimes(3);
});
