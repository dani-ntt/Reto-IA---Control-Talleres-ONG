const request = require("supertest");
const app = require("./server");
const db = require("./db");

jest.mock("../db");

describe("POST /api/auth/login", () => {
  const mockUser = {
    id: 1,
    nombre: "Daniel",
    apellido: "Tutor",
    email: "test@example.com",
    password_hash: "hashed-password",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("devuelve 200 y token cuando las credenciales son correctas", async () => {
    // Simula que la BD devuelve un usuario
    db.query.mockResolvedValueOnce([[mockUser], []]);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "123456" });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("usuario");
    expect(response.body.usuario.email).toBe("test@example.com");
  });

  test("devuelve 401 cuando las credenciales son incorrectas", async () => {
    // Simula que la BD no encuentra usuario
    db.query.mockResolvedValueOnce([[], []]);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@example.com", password: "badpass" });

    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
    expect(response.body).toHaveProperty("message");
  });
});

