# services/ruc_validator.py
import requests
from django.conf import settings



def validar_ruc(ruc):
    API_TOKEN = settings.APISPERU_TOKEN  
    url = f"https://dniruc.apisperu.com/api/v1/ruc/{ruc}?token={API_TOKEN}"

    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()

            # Caso: RUC no válido o no encontrado
            if not data or data.get("ruc") is None:
                return {
                    "valido": False,
                    "error": f"El RUC {ruc} no existe o no fue encontrado en SUNAT."
                }

            # Caso: RUC encontrado pero no activo
            estado = data.get("estado", "").upper()
            if estado != "ACTIVO":
                return {
                    "valido": False,
                    "error": f"El RUC {ruc} fue encontrado, pero el contribuyente está en estado: {estado}."
                }

            # Caso: todo correcto
            return {
                "valido": True,
                "ruc": data.get("ruc"),
                "razon_social": data.get("razonSocial"),
                "direccion": data.get("direccion"),
                "estado": estado,
                "condicion": data.get("condicion"),
                "departamento": data.get("departamento"),
                "provincia": data.get("provincia"),
                "distrito": data.get("distrito")
            }

        else:
            # Error HTTP
            return {
                "valido": False,
                "error": f"Error al consultar el RUC. Código HTTP: {response.status_code}. Mensaje: {response.text}"
            }

    except requests.exceptions.RequestException as e:
        # Error de red, conexión o timeout
        return {
            "valido": False,
            "error": f"Error de conexión al consultar la API: {str(e)}"
        }