const plotDimensions = () => {
  return {
    width: window.innerWidth - 300,
    height: window.innerHeight - 400
  };
};

const getBBSize = container => {
  let { width, height } = container.current.getBoundingClientRect();
  return {
    width: width,
    height: height
  };
};

export { plotDimensions, getBBSize };
