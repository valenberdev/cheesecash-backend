import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/user.repository", () => ({
  findUserById: vi.fn(),
  updateUserFullName: vi.fn(),
  findUserByIdWithPassword: vi.fn(),
  updateUserPassword: vi.fn(),
  getUserThresholds: vi.fn(),
  updateUserThresholds: vi.fn(),
  getUserPin: vi.fn(),
  setUserPin: vi.fn(),
  generateUniquePin: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("nuevo-hash-simulado"),
    compare: vi.fn(),
  },
}));

import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getMyThresholds,
  updateMyThresholds,
  getMyPin,
} from "../../src/services/user.service";
import {
  findUserById,
  updateUserFullName,
  findUserByIdWithPassword,
  updateUserPassword,
  getUserThresholds,
  updateUserThresholds,
  getUserPin,
  setUserPin,
} from "../../src/repositories/user.repository";
import bcrypt from "bcryptjs";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserProfile", () => {
  it("devuelve el perfil cuando el usuario existe", async () => {
    (findUserById as any).mockResolvedValueOnce({
      id: 1,
      email: "test@test.com",
    });

    const result = await getUserProfile(1);

    expect(result.email).toBe("test@test.com");
  });

  it("tira error si el usuario no existe", async () => {
    (findUserById as any).mockResolvedValueOnce(null);

    await expect(getUserProfile(999)).rejects.toThrow("Usuario no encontrado");
  });
});

describe("updateUserProfile", () => {
  it("actualiza el nombre completo", async () => {
    (updateUserFullName as any).mockResolvedValueOnce({
      id: 1,
      full_name: "Nombre Nuevo",
    });

    const result = await updateUserProfile(1, "Nombre Nuevo");

    expect(result.full_name).toBe("Nombre Nuevo");
    expect(updateUserFullName).toHaveBeenCalledWith(1, "Nombre Nuevo");
  });
});

describe("changePassword", () => {
  it("tira error si el usuario no existe", async () => {
    (findUserByIdWithPassword as any).mockResolvedValueOnce(null);

    await expect(
      changePassword(999, "actual123", "nueva12345"),
    ).rejects.toThrow("Usuario no encontrado");
  });

  it("tira error si la contraseña actual no coincide", async () => {
    (findUserByIdWithPassword as any).mockResolvedValueOnce({
      id: 1,
      password_hash: "hash-real",
    });
    (bcrypt.compare as any).mockResolvedValueOnce(false);

    await expect(changePassword(1, "incorrecta", "nueva12345")).rejects.toThrow(
      "Contraseña actual incorrecta",
    );
  });

  it("tira error si la nueva contraseña es muy corta", async () => {
    (findUserByIdWithPassword as any).mockResolvedValueOnce({
      id: 1,
      password_hash: "hash-real",
    });
    (bcrypt.compare as any).mockResolvedValueOnce(true);

    await expect(changePassword(1, "actual123", "123")).rejects.toThrow(
      "La contraseña debe tener al menos 8 caracteres",
    );
  });

  it("actualiza la contraseña cuando todo es válido", async () => {
    (findUserByIdWithPassword as any).mockResolvedValueOnce({
      id: 1,
      password_hash: "hash-real",
    });
    (bcrypt.compare as any).mockResolvedValueOnce(true);

    await changePassword(1, "actual123", "nueva12345");

    expect(updateUserPassword).toHaveBeenCalledWith(1, "nuevo-hash-simulado");
  });
});

describe("getMyThresholds", () => {
  it("devuelve los umbrales del usuario", async () => {
    (getUserThresholds as any).mockResolvedValueOnce({
      threshold_ars: "500000.00",
    });

    const result = await getMyThresholds(1);

    expect(result.threshold_ars).toBe("500000.00");
  });

  it("tira error si el usuario no existe", async () => {
    (getUserThresholds as any).mockResolvedValueOnce(null);

    await expect(getMyThresholds(999)).rejects.toThrow("Usuario no encontrado");
  });
});

describe("updateMyThresholds", () => {
  it("llama a updateUserThresholds con los valores correctos", async () => {
    await updateMyThresholds(1, 100000, 200, 200, 500);

    expect(updateUserThresholds).toHaveBeenCalledWith(1, {
      ars: 100000,
      usd: 200,
      eur: 200,
      btcUsd: 500,
    });
  });
});

describe("getMyPin", () => {
  it("devuelve el pin si ya existe", async () => {
    (getUserPin as any).mockResolvedValueOnce("123456");

    const result = await getMyPin(1);

    expect(result).toBe("123456");
    expect(setUserPin).not.toHaveBeenCalled();
  });

  it("genera y guarda un pin nuevo si el usuario todavía no tiene", async () => {
    (getUserPin as any).mockResolvedValueOnce(null);
    const { generateUniquePin } =
      await import("../../src/repositories/user.repository");
    (generateUniquePin as any).mockResolvedValueOnce("654321");

    const result = await getMyPin(1);

    expect(result).toBe("654321");
    expect(setUserPin).toHaveBeenCalledWith(1, "654321");
  });
});
