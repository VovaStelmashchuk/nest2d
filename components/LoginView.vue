<template>
  <div class="container p-4">
    <GoogleLogin :callback="callback" class="w-full" />
  </div>
</template>

<script setup lang="js">

const callback = (response) => {
  console.log("Handle the response", response)
}
</script>
