export function parseForm(parent: HTMLElement): Record<string, unknown> {
  const elements = parent.querySelectorAll(`input,select,range-picker`);
  const record: Record<string, unknown> = {};

  elements.forEach(element => {
    if (element instanceof HTMLElement && element.getAttribute("name")?.startsWith("effect.")) {
      const name = (element.getAttribute("name") ?? "").substring(7);
      if (name !== "serialized") {

        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
          if (element.getAttribute("type") === "number")
            record[name] = parseFloat(element.value);
          else if (element.getAttribute("type") === "checkbox")
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            record[name] = (element as any).checked ?? false;
          else
            record[name] = element.value;
        }
      }
    }
  });

  const rangePickers = parent.querySelectorAll(`range-picker`);
  rangePickers.forEach(element => {
    const name = element.getAttribute("name");
    if (name?.startsWith("effect.")) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      record[name.substring(7)] = (element as any).value
    }
  });

  return record;
}