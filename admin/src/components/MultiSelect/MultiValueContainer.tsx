import { Tag } from '@strapi/design-system';
import { Cross } from '@strapi/icons';

const OTHER_VALUE = '__other__';

export default ({
  selectProps,
  data,
}: {
  selectProps: any;
  data: {
    value: string;
    label: string;
  };
}) => {
  const handleTagClick = (data: { value: string; label: string }) => (e: React.UIEvent<any>) => {
    e.preventDefault();
    selectProps.onChange(selectProps.value.filter((v: any) => v !== data));
  };

  const displayLabel =
    data.value === OTHER_VALUE && selectProps.otherText
      ? `${data.label}: ${selectProps.otherText}`
      : data.label;

  return (
    <Tag tabIndex={-1} icon={<Cross />} onClick={handleTagClick(data)}>
      {displayLabel}
    </Tag>
  );
};
