from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

def obtener_cursos_por_categoria(categoria=None):
    service = Service(ChromeDriverManager().install())
    option = webdriver.ChromeOptions()
    option.add_argument('--headless')
    driver = webdriver.Chrome(service=service, options=option)

    url = "https://aprendemasinterbank.pe/cursos/"
    driver.get(url)
    wait = WebDriverWait(driver, 10)

    cursos = set()
    todos_cursos = []

    def extraer_cursos():
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'div.course-card.course-card--paginated')))
        tarjetas = driver.find_elements(By.CSS_SELECTOR, 'div.course-card.course-card--paginated')
        nuevos = []
        for card in tarjetas:
            try:
                titulo = card.find_element(By.CSS_SELECTOR, 'p.text-body3').get_attribute('title').strip()
                descripcion = card.find_element(By.CSS_SELECTOR, 'p.text-body4').get_attribute('title').strip()
                try:
                    boton = card.find_element(By.CSS_SELECTOR, 'a[href^="/cursos/"]')
                    href = boton.get_attribute('href')
                    enlace = "https://aprendemasinterbank.pe" + boton.get_attribute('href') if href.startswith('/') else href
                except:
                    enlace = "No encontrado"
                if (titulo, descripcion) not in cursos:
                    cursos.add((titulo, descripcion))
                    nuevos.append({'titulo': titulo, 'descripcion': descripcion, 'enlace': enlace})
            except Exception as e:
                print("Error procesando tarjeta:", e)
        return nuevos

    todos_cursos.extend(extraer_cursos())
    while True:
        try:
            next_btn = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'button[aria-label="Go to next page"]')))
            if next_btn.get_attribute("disabled"):
                break
            else:
                driver.execute_script("window.scrollBy(0, 300);")
                driver.execute_script("arguments[0].scrollIntoView(true);", next_btn)
                time.sleep(0.3)
                driver.execute_script("arguments[0].click();", next_btn)
                time.sleep(2)
                nuevos = extraer_cursos()
                todos_cursos.extend(nuevos)
        except Exception as e:
            break

    driver.quit()

    # Filtra por categoría si se proporciona
    if categoria:
        filtrados = [c for c in todos_cursos if categoria.lower() in c['titulo'].lower() or categoria.lower() in c['descripcion'].lower()]
        return filtrados
    return todos_cursos