import { render, screen } from "@testing-library/react";
import App from "./App";

test("muestra el título de la aplicación de inscripciones", () => {
  render(<App />);
  const titleElement = screen.getByText(/Aplicación de Inscripciones/i);
  expect(titleElement).toBeInTheDocument();
});
