import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoOpd, fecha, normalizarNif, parsearCpvs, tipoNormalizado } from "../lib/normaliza";
import { parsearBeneficiario } from "../bdns";
import { esDeLaRioja } from "../place";

test("fechas de las fuentes", () => {
  assert.equal(fecha("2016/10/26 00:00:00.000"), "2016-10-26");
  assert.equal(fecha("2026-11-17T20:16:01.467+01:00"), "2026-11-17");
  assert.equal(fecha(null), null);
});

test("NIF", () => {
  assert.equal(normalizarNif("b-26.120.964"), "B26120964");
  assert.equal(normalizarNif("***9033**"), null);
  assert.equal(normalizarNif("7298508129UTE"), "7298508129UTE");
});

test("tipos y estados", () => {
  assert.equal(tipoNormalizado("Suministros no Inventariables"), "Suministros");
  assert.equal(tipoNormalizado("Concesión de Servicios"), "Concesión de servicios");
  assert.equal(tipoNormalizado("CONTRATO DE OBRAS"), "Obras");
  assert.equal(estadoOpd("Pendiente de Adjudicación"), "Pendiente de adjudicación");
  assert.equal(estadoOpd("En Plazo"), "En plazo");
});

test("CPV", () => {
  assert.deepEqual(parsearCpvs("45233140, Obras viales"), [{ codigo: "45233140", descripcion: "Obras viales" }]);
});

test("beneficiarios BDNS", () => {
  assert.deepEqual(parsearBeneficiario("B26120964 AGUA Y JARDIN SL"), { nif: "B26120964", nombre: "AGUA Y JARDIN SL", personaFisica: false });
  assert.equal(parsearBeneficiario("***9033** VICTOR FERNANDEZ").personaFisica, true);
});

test("filtro La Rioja en PLACE", () => {
  assert.equal(esDeLaRioja({ postal: "26001", nuts: [], nombres: ["Ayuntamiento de Logroño"] }), true);
  assert.equal(esDeLaRioja({ postal: "28001", nuts: ["ES230"], nombres: ["Ministerio"] }), true);
  assert.equal(esDeLaRioja({ postal: "28001", nuts: [], nombres: ["Delegación Especial de la AEAT en La Rioja"] }), true);
  assert.equal(esDeLaRioja({ postal: "01300", nuts: ["ES211"], nombres: ["Cuadrilla de Rioja Alavesa"] }), false);
  assert.equal(esDeLaRioja({ postal: "28001", nuts: ["ES300"], nombres: ["Ministerio de Hacienda"] }), false);
});
