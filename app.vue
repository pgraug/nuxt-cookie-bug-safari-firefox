<template>
  <div>
    <h1>useCookie/refreshCookie bug in Safari and Firefox</h1>
    <p style="max-width: 600px">
      When a cookie's value is updated on the client from outside useCookie (eg.
      from a fetch request with set-cookie response headers or via
      document.cookie) there appears to be a little delay even after calling
      refreshCookie before the BroadcastChannel message is received and
      useCookie is updated.
    </p>

    <div>
      <p>Set cookie via:</p>
      <input
        type="radio"
        id="fetch"
        name="cookieMethod"
        value="fetch"
        v-model="cookieMethod"
      />
      <label for="fetch">fetch</label>
      <input
        type="radio"
        id="document.cookie"
        name="cookieMethod"
        value="document.cookie"
        v-model="cookieMethod"
      />
      <label for="document.cookie">document.cookie</label>
    </div>
    <br />
    <div>
      <input
        type="checkbox"
        id="shouldRefreshCookie"
        name="shouldRefreshCookie"
        v-model="shouldRefreshCookie"
      />
      <label for="shouldRefreshCookie"
        >Then call refreshCookie("testCookie") afterwards?</label
      >
    </div>
    <br />
    <div>
      <input
        type="checkbox"
        id="shouldDelay"
        name="shouldDelay"
        v-model="shouldDelay"
      />
      <label for="shouldDelay"
        >Then wait 10ms before taking snapshot of useCookie's value?</label
      >
    </div>
    <br />

    <button @click="testBug">Click to set the cookie</button>

    <div v-if="cookie">
      <p>useCookie value: {{ cookie }}</p>
    </div>

    <div v-if="source > initialValue">
      <p>Source value: {{ source }}</p>
      <p>
        Snapshot of cookie value: {{ cookieSnapshot }} (This should be the same
        as the source value, but in Safari and Firefox it isn't.)
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const cookieMethod = ref<"document.cookie" | "fetch">("fetch");
const shouldRefreshCookie = ref(false);
const shouldDelay = ref(false);

const cookie = useCookie("testCookie", {
  readonly: true,
});

const initialValue = Number.parseInt(cookie.value || "0");

const source = ref(initialValue);
const cookieSnapshot = ref(initialValue);

let cookieChannel = import.meta.client
  ? new BroadcastChannel("nuxt:cookies:testCookie")
  : undefined;

if (cookieChannel) {
  cookieChannel.onmessage = (event) => {
    console.log("channel message:", event.data);
  };
}

async function testBug() {
  // Increment the source value
  source.value += 1;

  if (cookieMethod.value === "document.cookie") {
    document.cookie = `testCookie=${source.value}`;
  } else {
    // Server endpoint sets the cookie value to the body's cookieValue
    await $fetch("/api/test", {
      method: "POST",
      body: { cookieValue: source.value },
    });
  }

  if (shouldRefreshCookie.value) {
    console.log("refreshing cookie");
    refreshCookie("testCookie");
  }

  if (shouldDelay.value) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const newValue = Number.parseInt(cookie.value || "0");
  console.log("setting cookieSnapshot:", newValue);
  cookieSnapshot.value = newValue;
}
</script>
