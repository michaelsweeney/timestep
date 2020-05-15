import React from 'react';

const SeriesData = props => {
  const { series, units } = props;

  let key = units == 'ip' ? 'value_ip' : 'value_si';

  console.log(series);
  return (
    <div>
      <ul>
        {series.map((d, i) => {
          return <li key={i}>{d[key]}</li>;
        })}
      </ul>
    </div>
  );
};

export { SeriesData };
