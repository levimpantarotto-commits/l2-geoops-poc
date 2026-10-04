"""Render a labelled, non-legal study map from the public raster and vectors.

The image is a cartographic composition of the cited inputs, not AI-created
satellite imagery. Re-run after automatic_case.py changes its GeoJSON output.
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
PUBLIC = HERE / "public-data"
DATA = HERE / "data/brazil-botucatu"
OUT = PUBLIC / "mapa_analise_automatica.png"
S = 1.0


def font(size: int, bold: bool = False):
    family = "segoeuib.ttf" if bold else "segoeui.ttf"
    path = Path("C:/Windows/Fonts") / family
    return ImageFont.truetype(str(path), size)


def mercator(lon: float, lat: float):
    return lon, math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def rings(geometry):
    typ = geometry["type"]
    if typ == "Polygon":
        yield geometry["coordinates"]
    elif typ == "MultiPolygon":
        yield from geometry["coordinates"]
    elif typ == "GeometryCollection":
        for member in geometry["geometries"]:
            yield from rings(member)


def lines(geometry):
    typ = geometry["type"]
    if typ == "LineString":
        yield geometry["coordinates"]
    elif typ == "MultiLineString":
        yield from geometry["coordinates"]
    elif typ == "GeometryCollection":
        for member in geometry["geometries"]:
            yield from lines(member)


def main():
    result = json.loads((PUBLIC / "result.json").read_text(encoding="utf-8"))
    analysis = json.loads((PUBLIC / "analise-automatica.json").read_text(encoding="utf-8"))
    boundary = json.loads((DATA / "perimetro.geojson").read_text(encoding="utf-8"))["features"][0]["geometry"]
    base = Image.open(PUBLIC / "base.png").convert("RGB")
    south, west = result["base"]["bounds"][0]
    north, east = result["base"]["bounds"][1]
    mx0, my0 = mercator(west, south)
    mx1, my1 = mercator(east, north)

    def base_point(lon, lat):
        x, y = mercator(lon, lat)
        return ((x - mx0) / (mx1 - mx0) * base.width,
                (my1 - y) / (my1 - my0) * base.height)

    boundary_points = [base_point(*p) for p in next(rings(boundary))[0]]
    xs, ys = zip(*boundary_points)
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    width, height = (x1 - x0) * 1.18, (y1 - y0) * 1.18
    map_w, map_h = 1290, 930
    if width / height < map_w / map_h:
        width = height * map_w / map_h
    else:
        height = width * map_h / map_w
    crop = (cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2)
    satellite = base.crop(tuple(round(v) for v in crop)).resize((map_w, map_h), Image.Resampling.LANCZOS)
    satellite = Image.blend(satellite, Image.new("RGB", satellite.size, (242, 237, 221)), .08)
    map_image = satellite.convert("RGBA")

    def p(lon, lat):
        bx, by = base_point(lon, lat)
        return (round((bx - crop[0]) / (crop[2] - crop[0]) * map_w),
                round((by - crop[1]) / (crop[3] - crop[1]) * map_h))

    by_code = {f["properties"]["code"]: f["geometry"] for f in analysis["features"]}

    def mask_for(geometry):
        mask = Image.new("L", (map_w, map_h), 0)
        d = ImageDraw.Draw(mask)
        for polygon in rings(geometry):
            d.polygon([p(*point) for point in polygon[0]], fill=255)
            for hole in polygon[1:]:
                d.polygon([p(*point) for point in hole], fill=0)
        return mask

    def composite_pattern(geometry, color, hatch=None, dots=False, fill_alpha=0):
        mask = mask_for(geometry)
        layer = Image.new("RGBA", (map_w, map_h), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        if fill_alpha:
            d.rectangle((0, 0, map_w, map_h), fill=(*color, fill_alpha))
        if hatch:
            for z in range(-map_h, map_w + map_h, 13):
                d.line((z, 0, z + map_h, map_h), fill=(*hatch, 218), width=3)
        if dots:
            for yy in range(5, map_h, 15):
                for xx in range(5, map_w, 15):
                    d.ellipse((xx - 2, yy - 2, xx + 2, yy + 2), fill=(79, 236, 103, 245))
        layer.putalpha(ImageChops.multiply(layer.getchannel("A"), mask))
        map_image.alpha_composite(layer)

    from PIL import ImageChops

    composite_pattern(by_code["AREA_CONSOLIDADA"], (239, 207, 91), hatch=(247, 215, 72), fill_alpha=32)
    composite_pattern(by_code["AVN-DESC-APP"], (46, 166, 85), dots=True, fill_alpha=70)
    composite_pattern(by_code["APP"], (50, 155, 204), hatch=(83, 203, 244), fill_alpha=75)
    d = ImageDraw.Draw(map_image)

    def draw_polygon_border(geometry, color, width_px=3, dash=None):
        for polygon in rings(geometry):
            coords = [p(*point) for point in polygon[0]]
            if not dash:
                d.line(coords + [coords[0]], fill=color, width=width_px, joint="curve")
                continue
            for a, b in zip(coords, coords[1:] + coords[:1]):
                length = math.dist(a, b)
                if length < 1:
                    continue
                ux, uy = (b[0] - a[0]) / length, (b[1] - a[1]) / length
                offset = 0.0
                while offset < length:
                    end = min(offset + dash[0], length)
                    d.line((a[0] + ux * offset, a[1] + uy * offset,
                            a[0] + ux * end, a[1] + uy * end), fill=color, width=width_px)
                    offset += sum(dash)

    draw_polygon_border(by_code["ARL"], (251, 166, 64, 255), 4, (11, 8))
    draw_polygon_border(by_code["APP"], (54, 161, 215, 255), 2)
    for line in lines(by_code["RIO_ATE_10"]):
        coords = [p(*point) for point in line]
        d.line(coords, fill=(233, 244, 244, 255), width=7, joint="curve")
        d.line(coords, fill=(21, 119, 194, 255), width=4, joint="curve")
    draw_polygon_border(boundary, (255, 78, 62, 255), 5)

    canvas = Image.new("RGB", (2000, 1190), (244, 247, 242))
    c = ImageDraw.Draw(canvas)
    c.rectangle((0, 0, 2000, 135), fill=(17, 48, 39))
    c.text((48, 26), "GEOOPS  /  ESTUDO AUTOMÁTICO", font=font(24, True), fill=(170, 222, 177))
    c.text((48, 62), "Regularização ambiental · Botucatu/SP", font=font(39, True), fill="white")
    c.text((1400, 42), "DEMONSTRAÇÃO / EXEMPLO", font=font(23, True), fill=(244, 214, 116))
    c.text((1400, 79), "Não é laudo, CAR ou aprovação", font=font(19), fill=(213, 227, 214))
    canvas.paste(map_image.convert("RGB"), (45, 165))
    c.rectangle((45, 165, 45 + map_w, 165 + map_h), outline=(202, 215, 202), width=2)

    c.rounded_rectangle((70, 189, 472, 251), radius=5, fill=(252, 253, 248), outline=(181, 191, 174), width=2)
    c.text((91, 203), "SITUAÇÃO DE ESTUDO · 2023", font=font(23, True), fill=(32, 61, 42))
    c.text((91, 231), "Sentinel-2 11/09/2023 · classes MapBiomas", font=font(13), fill=(81, 101, 83))
    c.polygon([(1290, 213), (1275, 257), (1290, 247), (1305, 257)], fill=(20, 45, 36), outline="white")
    c.text((1281, 187), "N", font=font(24, True), fill="white")
    c.rounded_rectangle((70, 1027, 557, 1078), radius=6, fill=(255, 255, 255), outline=(205, 211, 202), width=2)
    c.text((85, 1038), "Limite fictício  ·  SRC de cálculo EPSG:32722", font=font(17, True), fill=(37, 64, 46))

    sx = 1392
    c.text((sx, 177), "CAMADAS GERADAS", font=font(17, True), fill=(37, 89, 58))
    c.line((sx, 211, 1950, 211), fill=(200, 217, 202), width=2)
    rows = [
        ("AREA_CONSOLIDADA", "AC · uso persistente", "1.028,61 ha", (233, 198, 65), "Indício temporal · 2008 ∩ 2023"),
        ("ARL", "ARL · proposta", "282,89 ha", (238, 161, 65), "Não declarada no CAR"),
        ("AVN-DESC-APP", "AVN–DESC–APP", "225,41 ha", (45, 178, 81), "Vegetação fora da faixa de estudo"),
        ("APP", "APP · faixa de análise", "61,06 ha", (76, 166, 213), "Corredor geométrico · não APP legal"),
        ("RIO_ATE_10", "Rio Pardo · referência", "10,381 km", (24, 123, 192), "Largura até 10 m não verificada"),
    ]
    yy = 229
    for _, title, metric, color, note in rows:
        c.rounded_rectangle((sx, yy, 1951, yy + 91), radius=8, fill=(255, 255, 255), outline=(220, 228, 218), width=2)
        c.rectangle((sx + 13, yy + 19, sx + 38, yy + 44), fill=color)
        c.text((sx + 51, yy + 13), title, font=font(22, True), fill=(26, 50, 37))
        c.text((sx + 51, yy + 50), note, font=font(15), fill=(101, 120, 105))
        c.text((1810, yy + 16), metric, font=font(20, True), fill=(39, 79, 48))
        yy += 103
    c.text((sx, yy + 12), "OUTROS ITENS DO QUADRO", font=font(17, True), fill=(37, 89, 58))
    others = [("Cerrado mapeado", "8,47 ha"), ("Floresta mapeada", "216,85 ha"),
              ("AUAS", "não avaliado"), ("Utilidade pública", "não avaliado")]
    for n, (title, metric) in enumerate(others):
        ry = yy + 47 + n * 34
        c.text((sx, ry), title, font=font(17), fill=(52, 77, 55))
        c.text((1783, ry), metric, font=font(17, True), fill=(52, 77, 55))
    c.rounded_rectangle((sx, 951, 1951, 1094), radius=8, fill=(250, 243, 225), outline=(231, 214, 176), width=2)
    c.text((sx + 15, 967), "REVISÃO TÉCNICA OBRIGATÓRIA", font=font(18, True), fill=(132, 83, 37))
    for n, text in enumerate(["Áreas sobrepostas não devem ser somadas.", "APP, ARL e uso consolidado requerem documentos e", "análise jurídica/técnica. Perímetro é fictício."]):
        c.text((sx + 15, 998 + n * 26), text, font=font(16), fill=(100, 79, 48))
    c.text((48, 1125), "FONTES  ·  Sentinel-2/Copernicus 2023  ·  MapBiomas Brasil C9 2008/2023  ·  © OpenStreetMap contributors (ODbL)", font=font(17), fill=(57, 75, 59))
    c.text((48, 1153), "Operações PyQGIS: recorte, interseção, diferença e corredor de 30 m a partir do eixo do rio. Estudo ilustrativo, não decisão ambiental.", font=font(15), fill=(93, 106, 92))
    canvas.save(OUT, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
