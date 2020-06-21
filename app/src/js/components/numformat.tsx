import { format, timeFormat } from 'd3';

function formatInt(n) {
  if (!isFinite(+n)) {
    return 0;
  }

  if (n == 0) {
    return 0;
  }

  if (n < 0.001) {
    return format('.1e')(+n);
  }

  if (n < 1) {
    return format('.2n')(+n);
  }

  if (n < 10) {
    format('.2n')(+n);
  }

  if (n < 1000) {
    return format(',.0f')(+n);
  }
  if (n < 1000000) {
    return format('.3s')(+n);
  }
  if (n >= 1000000) {
    return format('.3s')(+n);
  } else {
    return format(',.0f')(+n);
  }
}

function formatTabular(n) {
  if (!isFinite(+n)) {
    return 0;
  }

  if (n == 0) {
    return 0;
  }

  if (n < 0.001) {
    return format('.2e')(+n);
  }

  if (n < 0.01) {
    return format('.4f')(+n);
  }

  if (n < 1) {
    return format('.3f')(+n);
  }

  if (n < 10) {
    format('.3f')(+n);
  }
  if (n < 100) {
    format('.2f')(+n);
  }
  if (n < 1000) {
    return format(',.1f')(+n);
  }

  if (n < 1000000) {
    return format('.2s')(+n);
  }

  if (n >= 1000000) {
    return format('.2e')(+n);
  } else {
    return format(',.0f')(+n);
  }
}

function formatDate(n) {
  let parsestr = '%d %b, %H:%M';
  return timeFormat(parsestr)(n);
}

export { formatInt, formatDate, formatTabular };
