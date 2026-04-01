import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "./Login";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function getLoginInputs() {
  const emailLabel = screen.getByText("Email");
  const passwordLabel = screen.getByText("Contraseña");

  const emailInput = emailLabel.parentElement.querySelector("input");
  const passwordInput = passwordLabel.parentElement.querySelector("input");
  const submitButton = screen.getByRole("button", { name: /Entrar/i });

  return { emailInput, passwordInput, submitButton };
}

test("renderiza los campos de email y contraseña y el botón de entrar", () => {
  render(<Login onLogin={jest.fn()} />);

  expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();

  const { emailInput, passwordInput, submitButton } = getLoginInputs();

  expect(emailInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();
});

test("muestra mensaje de error cuando el backend devuelve login incorrecto", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ok: false,
      message: "Usuario o contraseña incorrectos",
    }),
  });

  render(<Login onLogin={jest.fn()} />);

  const { emailInput, passwordInput, submitButton } = getLoginInputs();

  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(passwordInput, { target: { value: "wrongpass" } });

  fireEvent.click(submitButton);

  expect(
    await screen.findByText(/Usuario o contraseña incorrectos/i)
  ).toBeInTheDocument();
});

test("llama a onLogin cuando el backend devuelve login correcto", async () => {
  const fakeToken = "token-123";
  const fakeUsuario = { id: 1, nombre: "Tutor Test" };

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ok: true,
      token: fakeToken,
      usuario: fakeUsuario,
    }),
  });

  const onLogin = jest.fn();
  render(<Login onLogin={onLogin} />);

  const { emailInput, passwordInput, submitButton } = getLoginInputs();

  fireEvent.change(emailInput, { target: { value: "test@example.com" } });
  fireEvent.change(passwordInput, { target: { value: "123456" } });

  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(onLogin).toHaveBeenCalledWith(fakeToken, fakeUsuario);
  });
});
