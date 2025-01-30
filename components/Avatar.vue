<template>
  <a href="/profile">
    <img :src="data.avatar" alt="Avatar" class="w-12 h-12 rounded" />
  </a>
</template>
<script setup>
const useAuthState = useAuth();
const data = await useAuthState.fetchUser();
</script>
