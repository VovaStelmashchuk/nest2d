import { computed, reactive, readonly } from "vue";
import { defaultThemeType } from "~~/constants/theme.constants";

const themeCookie = useCookie('theme');

const state = reactive({
    theme: themeCookie.value || defaultThemeType,
})

function updateTheme(theme) {
    state.theme = theme;
    themeCookie.value = theme;
    document.documentElement.setAttribute('data-theme', theme);
}

export const themeStore = readonly({
    actions: {
        updateTheme
    }
});