export function parseForm(parent: HTMLElement): Record<string, unknown> {
  const elements = parent.querySelectorAll(`input,select`);
  const record = {};
  elements.forEach(element => {
    if (element instanceof HTMLElement && element.getAttribute("name")?.startsWith("effect.")) {
      const name = (element.getAttribute("name") ?? "").substring(7);
      if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement)
        record[name] = element.value;
    }
  });
  return record;
}