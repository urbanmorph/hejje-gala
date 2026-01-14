module.exports = {
	purge: [],
	darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {
			fontFamily: {
				sans: ['Poppins', 'sans-serif'],
				serif: ['Poppins', 'sans-serif'],
				mono: ['Poppins', 'sans-serif']
			}
		}
	},
	variants: {
		extend: {}
	},
	plugins: [require('@designbycode/tailwindcss-text-stroke')]
};
