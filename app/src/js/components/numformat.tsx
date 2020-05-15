import { format } from 'd3';

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

  if (n >= 1000000) {
    return format('.3s')(+n);
  } else {
    return format(',.0f')(+n);
  }
}

export { formatInt };
