import { reactive, readonly } from "vue";
import { defaultThemeType, themeType } from "~~/constants/theme.constants";

const themeCookie = useCookie('theme');

const state = reactive({
    theme: themeCookie.value || defaultThemeType,
})

function updateTheme() {
    if(state.theme === themeType.primary) {
        state.theme = defaultThemeType
    } else if(state.theme === defaultThemeType) {
        state.theme = themeType.primary
    }
    themeCookie.value = state.theme;
    document.documentElement.setAttribute('data-theme', state.theme);
}

export const themeStore = readonly({
    actions: {
        updateTheme
    }
});