"""Reproducible, source-labelled study overlays for the fixed Botucatu demo.

Outputs are candidates for technical review, never a CAR/APP/RL legal result.
The public site consumes this precomputed output; it does not run PyQGIS online.
"""
from __future__ import annotations

import json
from pathlib import Path
import re
from osgeo import gdal, ogr
from qgis.core import (QgsApplication, QgsCoordinateReferenceSystem,
                       QgsCoordinateTransform, QgsGeometry, QgsProject, QgsVectorLayer)

HERE = Path(__file__).resolve().parent
DATA = HERE / "data/brazil-botucatu"
PUBLIC = HERE / "public-data"
METRIC = QgsCoordinateReferenceSystem("EPSG:32722")
WGS84 = QgsCoordinateReferenceSystem("EPSG:4326")
AGRICULTURE = {15, 18, 19, 39, 20, 40, 62, 41, 36, 46, 47, 35, 48, 21}


def check(geometry: QgsGeometry, name: str) -> QgsGeometry:
    if geometry.isNull() or geometry.isEmpty():
        raise RuntimeError(f"{name}: geometria vazia")
    if not geometry.isGeosValid():
        geometry = geometry.makeValid()
    if not geometry.isGeosValid():
        raise RuntimeError(f"{name}: geometria inválida")
    return geometry


def union(parts: list[QgsGeometry], name: str) -> QgsGeometry:
    if not parts:
        raise RuntimeError(f"{name}: não há feições na fonte")
    return check(QgsGeometry.unaryUnion(parts), name)


def load_layer(path: Path, name: str) -> QgsVectorLayer:
    layer = QgsVectorLayer(str(path), name, "ogr")
    if not layer.isValid():
        raise RuntimeError(f"Não foi possível abrir {path}")
    return layer


def metric_geometry(feature, transform: QgsCoordinateTransform, name: str) -> QgsGeometry:
    geometry = QgsGeometry(feature.geometry())
    if geometry.transform(transform) != 0:
        raise RuntimeError(f"{name}: erro de projeção")
    return check(geometry, name)


def old_agriculture(mask: QgsGeometry) -> QgsGeometry:
    raster = gdal.Open(str(DATA / "mapbiomas_2008.tif"))
    if raster is None:
        raise RuntimeError("MapBiomas 2008 não disponível")
    memory = ogr.GetDriverByName("Memory").CreateDataSource("")
    pixels = memory.CreateLayer("coverage_2008", geom_type=ogr.wkbPolygon)
    pixels.CreateField(ogr.FieldDefn("code", ogr.OFTInteger))
    band = raster.GetRasterBand(1)
    if gdal.Polygonize(band, band.GetMaskBand(), pixels, 0, []) != 0:
        raise RuntimeError("Falha ao vetorizar MapBiomas 2008")
    source_crs = QgsCoordinateReferenceSystem.fromWkt(raster.GetProjection())
    transform = QgsCoordinateTransform(source_crs, METRIC, QgsProject.instance())
    parts = []
    for feature in pixels:
        if int(feature.GetField("code")) not in AGRICULTURE:
            continue
        geometry = QgsGeometry()
        geometry.fromWkb(bytes(feature.GetGeometryRef().ExportToWkb()))
        if geometry.transform(transform) != 0:
            raise RuntimeError("Falha ao projetar raster 2008")
        geometry = check(geometry, "uso 2008")
        if geometry.intersects(mask):
            clipped = geometry.intersection(mask)
            if not clipped.isEmpty() and clipped.area() > 1:
                parts.append(check(clipped, "uso 2008 recortado"))
    return union(parts, "uso agropecuário 2008")


def generate() -> dict:
    boundary_layer = load_layer(DATA / "perimetro.geojson", "perímetro fictício")
    to_metric = QgsCoordinateTransform(boundary_layer.crs(), METRIC, QgsProject.instance())
    mask = union([metric_geometry(f, to_metric, "perímetro") for f in boundary_layer.getFeatures()], "perímetro")

    coverage = load_layer(PUBLIC / "vetores.geojson", "cobertura 2023")
    to_metric = QgsCoordinateTransform(coverage.crs(), METRIC, QgsProject.instance())
    natural, agriculture, forest, cerrado = [], [], [], []
    for feature in coverage.getFeatures():
        label = feature["class"]
        geometry = metric_geometry(feature, to_metric, "cobertura 2023")
        if label == "Vegetação nativa mapeada":
            natural.append(geometry)
            source_code = re.match(r"MB (\d+)", feature["name"])
            if source_code and source_code.group(1) == "3":
                forest.append(geometry)
            if source_code and source_code.group(1) == "4":
                cerrado.append(geometry)
        elif label == "Uso agropecuário":
            agriculture.append(geometry)
    natural_2023 = union(natural, "vegetação nativa 2023")
    agriculture_2023 = union(agriculture, "uso 2023")

    hydro = load_layer(DATA / "rio_pardo_osm.geojson", "Rio Pardo OSM")
    to_metric = QgsCoordinateTransform(hydro.crs(), METRIC, QgsProject.instance())
    river_parts = []
    for feature in hydro.getFeatures():
        shape = metric_geometry(feature, to_metric, "eixo do Rio Pardo")
        if shape.intersects(mask):
            clipped = shape.intersection(mask)
            if not clipped.isEmpty():
                river_parts.append(check(clipped, "rio recortado"))
    river = union(river_parts, "Rio Pardo no perímetro")

    corridor = check(river.buffer(30, 8).intersection(mask), "corredor de análise 30m")
    native_outside_corridor = check(natural_2023.difference(corridor), "nativa fora do corredor")
    persistent_agriculture = check(old_agriculture(mask).intersection(agriculture_2023), "uso persistente 2008/2023")

    # This is deliberately a *proposal input*, not a detected or approved Reserve Legal.
    # Selection of the mapped natural vegetation makes the draft deterministic and editable.
    reserve_proposal = QgsGeometry(natural_2023)

    to_wgs = QgsCoordinateTransform(METRIC, WGS84, QgsProject.instance())
    definitions = [
        ("RIO_ATE_10", river, "linha", "Rio Pardo OSM; largura não verificada", "OSM Rio Pardo", "referência; não comprova largura até 10 m"),
        ("APP", corridor, "área", "Faixa de análise de 30 m do eixo OSM; não é APP delimitada", "Rio Pardo OSM + buffer geométrico", "hipótese espacial; margem e regra legal não validadas"),
        ("AVN-DESC-APP", native_outside_corridor, "área", "Vegetação mapeada 2023 menos faixa de análise", "MapBiomas 2023 - corredor 30 m", "diferença geométrica; APP legal não delimitada"),
        ("ARL", reserve_proposal, "área", "Proposta ilustrativa sobre vegetação mapeada; não é RL declarada", "MapBiomas 2023", "proposta; requer CAR, documentos e análise"),
        ("AREA_CONSOLIDADA", persistent_agriculture, "área", "Uso agropecuário persistente em 2008 e 2023", "MapBiomas 2008 ∩ 2023", "indício temporal; não comprova ocupação antes de 22/07/2008"),
    ]
    features, summary = [], {}
    for code, original, kind, label, source, warning in definitions:
        geometry = QgsGeometry(original)
        if geometry.transform(to_wgs) != 0:
            raise RuntimeError(f"Falha ao exportar {code}")
        area = original.area() / 10000 if kind == "área" else None
        length = original.length() / 1000 if kind == "linha" else None
        summary[code] = {"areaHa": round(area, 4) if area is not None else None,
                         "lengthKm": round(length, 4) if length is not None else None,
                         "label": label, "source": source, "warning": warning,
                         "status": "CANDIDATO · REVISÃO TÉCNICA"}
        features.append({"type": "Feature", "id": code,
                         "geometry": json.loads(geometry.asJson(6)),
                         "properties": {"code": code, "label": label, "source": source,
                                        "warning": warning, "area_ha": summary[code]["areaHa"],
                                        "length_km": summary[code]["lengthKm"],
                                        "status": summary[code]["status"]}})
    summary["CERRADO_2023"] = {"areaHa": round(union(cerrado, "Cerrado").area() / 10000, 4),
                               "label": "Formação savânica mapeada em 2023; não é tipologia pericial"}
    summary["FLORESTA_2023"] = {"areaHa": round(union(forest, "Floresta").area() / 10000, 4),
                                "label": "Formação florestal mapeada em 2023; não é tipologia pericial"}
    summary["AUAS"] = {"areaHa": None, "label": "Não avaliada nesta demonstração"}
    summary["UT_PUBLICA"] = {"areaHa": None, "label": "Não avaliada nesta demonstração"}
    return {"type": "FeatureCollection", "features": features,
            "metadata": {"case": "Botucatu/SP · perímetro fictício", "crs": "EPSG:4326",
                         "measurementCrs": "EPSG:32722", "analysisDate": "2023-09-11",
                         "basis": "Sentinel-2 visual, MapBiomas Coleção 9 (2008/2023), OpenStreetMap Rio Pardo",
                         "method": "operações PyQGIS reais: recorte, buffer, diferença e interseção",
                         "legalStatus": "Estudo demonstrativo, não laudo, CAR validado ou declaração de regularidade",
                         "summary": summary}}


def main() -> None:
    app = QgsApplication([], False)
    app.initQgis()
    try:
        payload = generate()
        output = PUBLIC / "analise-automatica.json"
        output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(json.dumps({"output": str(output), "summary": payload["metadata"]["summary"]}, ensure_ascii=False))
    finally:
        app.exitQgis()


if __name__ == "__main__":
    main()
