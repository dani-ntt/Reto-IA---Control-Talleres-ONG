import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "./Register";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function getRegisterInputs() {
  // El h2 real es "Registro de nuevo usuario"
  const title = screen.getByText(/Registro de nuevo usuario/i);

  // Los labels reales incluyen asterisco o texto diferente, usamos el texto completo que se ve en el HTML
  const nombreLabel = screen.getByText("Nombre *");
  const apellidoLabel = screen.getByText("Apellido *");
  const emailLabel = screen.getByText("Email *");
  const telefonoLabel = screen.getByText("Teléfono");
  const passwordLabel = screen.getByText("Contraseña *");
  const repeatPasswordLabel = screen.getByText("Repite la contraseña *");

  const nombreInput = nombreLabel.parentElement.querySelector("input");
  const apellidoInput = apellidoLabel.parentElement.querySelector("input");
  const emailInput = emailLabel.parentElement.querySelector("input");
  const telefonoInput = telefonoLabel.parentElement.querySelector("input");
  const passwordInput = passwordLabel.parentElement.querySelector("input");
  const repeatPasswordInput =
    repeatPasswordLabel.parentElement.querySelector("input");

  const submitButton = screen.getByRole("button", { name: /Registrarme/i });

  return {
    title,
    nombreInput,
    apellidoInput,
    emailInput,
    telefonoInput,
    passwordInput,
    repeatPasswordInput,
    submitButton,
  };
}

test("renderiza los campos básicos del formulario de registro", () => {
  render(<Register onRegistered={jest.fn()} />);

  const {
    title,
    nombreInput,
    apellidoInput,
    emailInput,
    telefonoInput,
    passwordInput,
    repeatPasswordInput,
    submitButton,
  } = getRegisterInputs();

  expect(title).toBeInTheDocument();
  expect(nombreInput).toBeInTheDocument();
  expect(apellidoInput).toBeInTheDocument();
  expect(emailInput).toBeInTheDocument();
  expect(telefonoInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
  expect(repeatPasswordInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();
});

test("muestra error si las contraseñas no coinciden", async () => {
  render(<Register onRegistered={jest.fn()} />);

  const {
    nombreInput,
    apellidoInput,
    emailInput,
    telefonoInput,
    passwordInput,
    repeatPasswordInput,
    submitButton,
  } = getRegisterInputs();

  fireEvent.change(nombreInput, { target: { value: "Nombre" } });
  fireEvent.change(apellidoInput, { target: { value: "Apellido" } });
  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(telefonoInput, { target: { value: "600000000" } });
  fireEvent.change(passwordInput, { target: { value: "123456" } });
  fireEvent.change(repeatPasswordInput, { target: { value: "654321" } });

  fireEvent.click(submitButton);

  expect(
    await screen.findByText(/Las contraseñas no coinciden/i)
  ).toBeInTheDocument();
});

test("llama a onRegistered cuando el backend registra correctamente", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ok: true,
      message: "Tutor registrado correctamente.",
    }),
  });

  const onRegistered = jest.fn();
  render(<Register onRegistered={onRegistered} />);

  const {
    nombreInput,
    apellidoInput,
    emailInput,
    telefonoInput,
    passwordInput,
    repeatPasswordInput,
    submitButton,
  } = getRegisterInputs();

  fireEvent.change(nombreInput, { target: { value: "Nombre" } });
  fireEvent.change(apellidoInput, { target: { value: "Apellido" } });
  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(telefonoInput, { target: { value: "600000000" } });
  fireEvent.change(passwordInput, { target: { value: "123456" } });
  fireEvent.change(repeatPasswordInput, { target: { value: "123456" } });

  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(onRegistered).toHaveBeenCalled();
  });
});
