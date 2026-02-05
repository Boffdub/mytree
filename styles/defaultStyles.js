// Default font styles for the app
// Use these constants to ensure consistent font usage

export const fonts = {
  regular: 'Montserrat-Regular',
  semiBold: 'Montserrat-SemiBold',
  bold: 'Montserrat-Bold',
};

// Helper function to add font to a style object
export const withFont = (style, weight = 'regular') => {
  return {
    ...style,
    fontFamily: fonts[weight],
  };
};
