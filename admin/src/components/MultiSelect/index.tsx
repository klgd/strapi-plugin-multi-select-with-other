import React, { useMemo, useCallback } from 'react';
import { Field, Flex, TextInput } from '@strapi/design-system';
import ReactSelect from './ReactSelect';
import { useField } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import MultiValueContainer from './MultiValueContainer';
import { getTrad } from '../../utils/getTrad';

const OTHER_VALUE = '__other__';

interface StoredValue {
  v: string[];
  o: string;
}

function parseStoredValue(raw: any): StoredValue {
  let parsed: any;
  try {
    parsed = typeof raw !== 'string' ? raw : JSON.parse(raw || '[]');
  } catch {
    parsed = [];
  }
  if (Array.isArray(parsed)) {
    return { v: parsed, o: '' };
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.v)) {
    return { v: parsed.v, o: parsed.o || '' };
  }
  return { v: [], o: '' };
}

function serializeValue(sv: StoredValue): string | null {
  if (!sv.v.length) return null;
  return JSON.stringify({ v: sv.v, o: sv.o || '' });
}

const MultiSelect = ({
  hint,
  label,
  name,
  intlLabel,
  required,
  attribute,
  description,
  placeholder,
  disabled,
}: {
  hint: string;
  label: string;
  name: string;
  intlLabel: any;
  required: boolean;
  attribute: any;
  description: any;
  placeholder: string;
  disabled: boolean;
}) => {
  const { formatMessage } = useIntl();
  const { onChange, value, error } = useField(name);

  const possibleOptions = useMemo(() => {
    const opts = (attribute['options'] || [])
      .map((option: string) => {
        const [label, value] = [...option.split(/:(.*)/s), option];
        if (!label || !value) return null;
        return { label, value };
      })
      .filter(Boolean);

    opts.push({
      label: formatMessage({ id: getTrad('multi-select.other.label'), defaultMessage: 'Other' }),
      value: OTHER_VALUE,
    });

    return opts;
  }, [attribute, formatMessage]);

  const stored = useMemo(() => parseStoredValue(value), [value]);

  const sanitizedValue = useMemo(() => {
    return stored.v
      .map((val) =>
        possibleOptions.find((option: { label: string; value: string }) => option.value === val)
      )
      .filter((option) => !!option);
  }, [stored, possibleOptions]);

  const isOtherSelected = useMemo(
    () => stored.v.includes(OTHER_VALUE),
    [stored]
  );

  const fieldError = useMemo(() => {
    if (error) return error;

    const { min, max } = attribute;
    const hasNoOptions = required && !possibleOptions.length;
    const belowMin = sanitizedValue.length < min && (required || sanitizedValue.length > 0);
    const aboveMax = sanitizedValue.length > max;

    if (hasNoOptions) {
      return 'No options, but field is required';
    }
    if (belowMin) {
      return `Select at least ${min} options`;
    }
    if (aboveMax) {
      return `Select at most ${max} options`;
    }
    if (isOtherSelected && !stored.o.trim()) {
      return formatMessage({
        id: getTrad('multi-select.other.error'),
        defaultMessage: 'Please enter a value for "Other"',
      });
    }

    return null;
  }, [required, error, possibleOptions, sanitizedValue, attribute, isOtherSelected, stored, formatMessage]);

  const handleSelectChange = useCallback(
    (val: any) => {
      const selectedValues = val?.length
        ? val.filter((v: any) => !!v).map((v: any) => v.value)
        : [];
      const keepOther = selectedValues.includes(OTHER_VALUE);
      const next: StoredValue = {
        v: selectedValues,
        o: keepOther ? stored.o : '',
      };
      onChange({
        target: {
          name,
          value: serializeValue(next),
          type: attribute.type,
        },
      } as React.ChangeEvent<HTMLInputElement>);
    },
    [name, attribute, stored, onChange]
  );

  const handleOtherTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next: StoredValue = { v: stored.v, o: e.target.value };
      onChange({
        target: {
          name,
          value: serializeValue(next),
          type: attribute.type,
        },
      } as React.ChangeEvent<HTMLInputElement>);
    },
    [name, attribute, stored, onChange]
  );

  return (
    <Field.Root
      hint={description?.id ? formatMessage(description) : hint}
      error={fieldError as string}
      name={name}
      required={required}
    >
      <Flex direction="column" alignItems="stretch" gap={1}>
        <Field.Label>{intlLabel?.id ? formatMessage(intlLabel) : label}</Field.Label>
        <ReactSelect
          isSearchable={true}
          isMulti={true}
          error={fieldError}
          name={name}
          id={name}
          otherText={stored.o}
          isOptionDisabled={() => sanitizedValue.length >= attribute['max'] || false}
          isDisabled={disabled || possibleOptions.length === 0}
          placeholder={placeholder}
          defaultValue={sanitizedValue.map((val: { label: string; value: string }) => ({
            label: val.value === OTHER_VALUE
              ? formatMessage({ id: getTrad('multi-select.other.label'), defaultMessage: 'Other' })
              : formatMessage({ id: val.label, defaultMessage: val.label }),
            value: val.value,
          }))}
          components={{
            MultiValueContainer,
          }}
          options={possibleOptions.map((option: { label: string; value: string }) => ({
            ...option,
            label: option.value === OTHER_VALUE
              ? option.label
              : formatMessage({ id: option.label, defaultMessage: option.label }),
          }))}
          onChange={handleSelectChange}
          classNames={{
            control: (_state: any) => 'select-control',
            multiValue: (_state: any) => 'select-multi-value',
            placeholder: (_state: any) => 'select-placeholder',
            menuList: (_state: any) => 'select-listbox',
            menu: (_state: any) => 'select-menu',
            option: (state: any) => (state.isFocused ? 'option-focused' : 'option'),
          }}
        />
        {isOtherSelected && (
          <TextInput
            placeholder={formatMessage({
              id: getTrad('multi-select.other.placeholder'),
              defaultMessage: 'Please specify',
            })}
            aria-label="Other value"
            name={`${name}-other`}
            value={stored.o}
            onChange={handleOtherTextChange}
            disabled={disabled}
          />
        )}
        <Field.Hint />
        <Field.Error />
      </Flex>
    </Field.Root>
  );
};

export default MultiSelect;
