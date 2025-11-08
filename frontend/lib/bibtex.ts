export interface ParsedBibtex {
  title?: string;
  authors?: string[];
  venue?: string;
  year?: number;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
}

const FIELD_ALIASES: Record<string, keyof ParsedBibtex> = {
  title: 'title',
  journal: 'venue',
  booktitle: 'venue',
  year: 'year',
  volume: 'volume',
  number: 'number',
  pages: 'pages',
  doi: 'doi'
};

export function parseBibtexEntry(input: string): ParsedBibtex {
  const result: ParsedBibtex = {};
  const content = input.replace(/@[^{]+\{[^,]+,/, '').replace(/}\s*$/, '');

  const fieldRegex = /([a-zA-Z]+)\s*=\s*(\{([^}]*)\}|"([^"]*)"|([^,]+))/g;
  let match: RegExpExecArray | null;

  while ((match = fieldRegex.exec(content))) {
    const key = match[1].toLowerCase();
    const rawValue = match[3] ?? match[4] ?? match[5] ?? '';
    const value = rawValue.trim();

    if (key === 'author') {
      result.authors = value
        .split(/\s+and\s+/i)
        .map(author => author.replace(/{|}/g, '').trim())
        .filter(Boolean);
      continue;
    }

    const mappedKey = FIELD_ALIASES[key];
    if (!mappedKey) {
      continue;
    }

    if (mappedKey === 'year') {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        result.year = parsed;
      }
      continue;
    }

    result[mappedKey] = value.replace(/{|}/g, '').trim();
  }

  return result;
}
