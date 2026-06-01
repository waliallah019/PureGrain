import argparse
import os
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver import ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_BASE_URL = os.getenv("PG_BASE_URL", "http://localhost:3000")
DEFAULT_TIMEOUT = int(os.getenv("PG_TIMEOUT", "20"))


def build_driver(headless: bool) -> webdriver.Chrome:
    options = ChromeOptions()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    options.add_argument("--no-default-browser-check")
    return webdriver.Chrome(options=options)


def wait(driver: webdriver.Chrome, timeout: int = DEFAULT_TIMEOUT) -> WebDriverWait:
    return WebDriverWait(driver, timeout)


def fill_input(driver: webdriver.Chrome, element_id: str, value: str) -> None:
    field = wait(driver).until(EC.visibility_of_element_located((By.ID, element_id)))
    field.clear()
    field.send_keys(value)


def click_submit(driver: webdriver.Chrome) -> None:
    wait(driver).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))).click()


def open_radix_select(driver: webdriver.Chrome, placeholder_text: str) -> None:
    trigger = wait(driver).until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//button[@role='combobox' and .//*[normalize-space()='{0}']] | "
                "//button[@role='combobox' and contains(., '{0}')]".format(placeholder_text),
            )
        )
    )
    driver.execute_script("arguments[0].click();", trigger)


def choose_radix_option(driver: webdriver.Chrome, option_text: str) -> None:
    option = wait(driver).until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//*[@role='option' and normalize-space()='{0}'] | //div[@role='option' and normalize-space()='{0}']".format(option_text),
            )
        )
    )
    driver.execute_script("arguments[0].click();", option)


def select_radix_value(driver: webdriver.Chrome, placeholder_text: str, option_text: str) -> None:
    open_radix_select(driver, placeholder_text)
    choose_radix_option(driver, option_text)


def inject_admin_session(driver: webdriver.Chrome, base_url: str) -> None:
    driver.get(base_url)
    driver.execute_script(
        "window.localStorage.setItem('admin-user', arguments[0]);",
        '{"email":"admin@puregrain.com","role":"admin"}',
    )


def login_admin_ui(driver: webdriver.Chrome, base_url: str) -> None:
    driver.get(f"{base_url}/admin-login")
    fill_input(driver, "email", "admin@puregrain.com")
    fill_input(driver, "password", "admin123")
    click_submit(driver)
    wait(driver).until(EC.url_contains("/admin"))


def login_admin(driver: webdriver.Chrome, base_url: str, mode: str) -> None:
    if mode == "storage":
        inject_admin_session(driver, base_url)
        driver.get(f"{base_url}/admin")
        wait(driver).until(EC.url_contains("/admin"))
        return
    login_admin_ui(driver, base_url)


def create_quote_request(driver: webdriver.Chrome, base_url: str) -> None:
    driver.get(f"{base_url}/quote-request")

    fill_input(driver, "companyName", os.getenv("PG_QUOTE_COMPANY", "SELENIUM Quote Company"))
    fill_input(driver, "contactPerson", os.getenv("PG_QUOTE_CONTACT", "Selenium User"))
    fill_input(driver, "email", os.getenv("PG_QUOTE_EMAIL", "qa+quote@example.com"))
    fill_input(driver, "phone", os.getenv("PG_QUOTE_PHONE", "+12025550123"))

    select_radix_value(driver, "Select destination country", os.getenv("PG_QUOTE_COUNTRY", "United States"))
    select_radix_value(driver, "Select business type", os.getenv("PG_QUOTE_BUSINESS_TYPE", "Importer"))
    select_radix_value(driver, "Select category", os.getenv("PG_QUOTE_CATEGORY", "custom"))

    fill_input(driver, "companyName", os.getenv("PG_QUOTE_COMPANY", "SELENIUM Quote Company"))
    fill_input(driver, "contactPerson", os.getenv("PG_QUOTE_CONTACT", "Selenium User"))
    fill_input(driver, "email", os.getenv("PG_QUOTE_EMAIL", "qa+quote@example.com"))

    product_name = wait(driver).until(EC.visibility_of_element_located((By.NAME, "productName")))
    product_name.clear()
    product_name.send_keys(os.getenv("PG_QUOTE_PRODUCT_NAME", "Selenium Custom Wallet"))

    quantity = wait(driver).until(EC.visibility_of_element_located((By.NAME, "quantity")))
    quantity.clear()
    quantity.send_keys(os.getenv("PG_QUOTE_QUANTITY", "250"))

    select_radix_value(driver, "Select unit", os.getenv("PG_QUOTE_QUANTITY_UNIT", "pieces"))
    select_radix_value(driver, "When do you need this?", os.getenv("PG_QUOTE_TIMELINE", "1month"))

    fill_input(
        driver,
        "specifications",
        os.getenv(
            "PG_QUOTE_SPECIFICATIONS",
            "Automation seed: private-label leather wallet request with black and tan color variants.",
        ),
    )

    click_submit(driver)
    wait(driver).until(EC.url_contains("/catalog"))


def create_custom_manufacturing_request(driver: webdriver.Chrome, base_url: str, design_file: str | None) -> None:
    driver.get(f"{base_url}/custom-manufacturing")

    fill_input(driver, "companyName", os.getenv("PG_CUSTOM_COMPANY", "SELENIUM Manufacturing Company"))
    fill_input(driver, "contactPerson", os.getenv("PG_CUSTOM_CONTACT", "Selenium User"))
    fill_input(driver, "email", os.getenv("PG_CUSTOM_EMAIL", "qa+custom@example.com"))
    fill_input(driver, "phone", os.getenv("PG_CUSTOM_PHONE", "+12025550123"))
    fill_input(driver, "estimatedQuantity", os.getenv("PG_CUSTOM_QUANTITY", "1000"))
    fill_input(
        driver,
        "specifications",
        os.getenv(
            "PG_CUSTOM_SPECIFICATIONS",
            "Automation seed: custom leather accessory run with debossed branding and export packaging.",
        ),
    )

    if design_file:
        file_path = Path(design_file).expanduser().resolve()
        if not file_path.exists():
            raise FileNotFoundError(f"Design file not found: {file_path}")
        upload = wait(driver).until(EC.presence_of_element_located((By.ID, "designFiles")))
        upload.send_keys(str(file_path))

    click_submit(driver)
    wait(driver).until(EC.visibility_of_element_located((By.XPATH, "//*[contains(., 'Request Submitted') or contains(., 'successfully submitted')]")))


def run_flow(args: argparse.Namespace) -> None:
    driver = build_driver(headless=args.headless)
    try:
        if args.flow == "admin-login":
            login_admin(driver, args.base_url, args.login_mode)
            return

        if args.login_mode:
            login_admin(driver, args.base_url, args.login_mode)

        if args.flow == "quote":
            create_quote_request(driver, args.base_url)
        elif args.flow == "custom-manufacturing":
            create_custom_manufacturing_request(driver, args.base_url, args.design_file)
        else:
            raise ValueError(f"Unsupported flow: {args.flow}")
    finally:
        if args.pause:
            input("Press Enter to close the browser...")
        driver.quit()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="PureGrain Selenium data seeding starter.")
    parser.add_argument(
        "flow",
        choices=["admin-login", "quote", "custom-manufacturing"],
        help="Browser flow to execute.",
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Application base URL.")
    parser.add_argument(
        "--login-mode",
        choices=["ui", "storage"],
        default=None,
        help="Optional admin login mode before running the flow.",
    )
    parser.add_argument("--design-file", default=None, help="Optional design file path for custom manufacturing.")
    parser.add_argument("--headless", action="store_true", help="Run the browser headlessly.")
    parser.add_argument("--pause", action="store_true", help="Keep the browser open until Enter is pressed.")
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    try:
        run_flow(arguments)
    except TimeoutException as exc:
        raise SystemExit(f"Timed out waiting for UI state: {exc}") from exc