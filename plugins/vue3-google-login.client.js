import vue3GoogleLogin from "vue3-google-login";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(vue3GoogleLogin, {
    clientId:
      "476104126469-bv13u3dlpooq1j3jglcgj7sup6dt26nk.apps.googleusercontent.com",
  });
});
