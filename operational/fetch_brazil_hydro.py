"""Fetch public OSM river centerlines for the fixed Botucatu study example.

This does not establish channel width, riverbank, legal APP, or CAR status.
The generated GeoJSON is a source vector, not a legal environmental layer.
"""
from __future__ import annotations

import json
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree

HERE = Path(__file__).resolve().parent
OUT = HERE / "data/brazil-botucatu/rio_pardo_osm.geojson"
URL = "https://api.openstreetmap.org/api/0.6/map?bbox=-48.49,-23.01,-48.43,-22.96"


def main() -> None:
    request = Request(URL, headers={"User-Agent": "GeoOps-Public-Case/1.0 (source verification)"})
    with urlopen(request, timeout=35) as response:
        xml = ElementTree.fromstring(response.read())
    nodes = {
        node.attrib["id"]: [float(node.attrib["lon"]), float(node.attrib["lat"])]
        for node in xml.findall("node")
    }
    features = []
    for way in xml.findall("way"):
        tags = {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")}
        if tags.get("waterway") != "river" or tags.get("name") != "Rio Pardo":
            continue
        points = [nodes[nd.attrib["ref"]] for nd in way.findall("nd") if nd.attrib["ref"] in nodes]
        if len(points) < 2:
            continue
        features.append({
            "type": "Feature",
            "id": "osm-way-" + way.attrib["id"],
            "properties": {"name": "Rio Pardo", "source": "OpenStreetMap contributors",
                           "osm_way_id": way.attrib["id"], "waterway": "river",
                           "width_verified": False},
            "geometry": {"type": "LineString", "coordinates": points},
        })
    if len(features) < 2:
        raise RuntimeError("Rio Pardo não foi encontrado na consulta pública; não fabricar traçado.")
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": features},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(features)} eixos OSM salvos em {OUT}")


if __name__ == "__main__":
    main()
