import React, { useEffect, useRef, useState } from 'react';

/**
 * Campo numérico pensado para o Brasil.
 *
 * - Aceita vírgula OU ponto como separador decimal ("39,90" e "39.90" valem o mesmo).
 * - Pode ser apagado por completo enquanto a pessoa digita (não "volta" para o valor anterior).
 * - Não aceita letras nem sinal negativo.
 * - Fora de foco, mostra o número formatado com vírgula.
 *
 * Para manter os handlers existentes, `onChange` recebe `{ target: { value } }` com o
 * número já normalizado para ponto ("39.90"), ou "" quando o campo está vazio.
 */
type NativeProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'>;

export interface NumberInputProps extends NativeProps {
  value: number | string | null | undefined;
  onChange: (e: { target: { value: string } }) => void;
  /** Casas decimais aceitas. 0 = só inteiros. Padrão: 2. */
  decimals?: number;
  /** Mostra sempre 2 casas fora de foco (para valores em R$). */
  money?: boolean;
}

function toNumber(value: NumberInputProps['value']): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return isFinite(n) ? n : null;
}

export function formatNumberBR(n: number, decimals: number, money = false): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: money ? 2 : 0,
    maximumFractionDigits: decimals,
    useGrouping: false,
  });
}

function sanitize(raw: string, decimals: number): string {
  let out = '';
  let hasSep = false;
  let decimalsTyped = 0;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      if (hasSep) {
        if (decimalsTyped >= decimals) continue;
        decimalsTyped++;
      }
      out += ch;
    } else if ((ch === ',' || ch === '.') && !hasSep && decimals > 0) {
      hasSep = true;
      out += ',';
    }
  }
  return out;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  decimals = 2,
  money = false,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const draftRef = useRef<string | null>(null);
  draftRef.current = draft;

  const numeric = toNumber(value);
  const formatted = numeric === null ? '' : formatNumberBR(numeric, decimals, money);

  // Se o valor mudar POR FORA enquanto o campo está em foco (ex.: "Redefinir campos"),
  // o rascunho acompanha. Mudanças causadas pela própria digitação são ignoradas, para
  // que valores-padrão do formulário (ex.: "|| 200") não reescrevam o que a pessoa digita.
  const selfChange = useRef(false);
  useEffect(() => {
    if (selfChange.current) {
      selfChange.current = false;
      return;
    }
    if (draftRef.current !== null) setDraft(formatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric]);

  return (
    <input
      {...rest}
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={draft ?? formatted}
      onFocus={(e) => {
        setDraft(formatted);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
      onChange={(e) => {
        const clean = sanitize(e.target.value, decimals);
        setDraft(clean);
        selfChange.current = true;
        onChange({ target: { value: clean.replace(',', '.') } });
      }}
    />
  );
};
