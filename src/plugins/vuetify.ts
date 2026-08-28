// src/plugins/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Keep in step with the tokens in src/assets/base.css. Without this Vuetify renders its
// default blue/teal, which is why form buttons used to disagree with every other page.
export default createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#6200ee',
                    secondary: '#03dac6',
                    error: '#b00020',
                    warning: '#ffc107',
                    success: '#4caf50',
                },
            },
        },
    },
});
