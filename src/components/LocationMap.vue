<script setup lang="ts">
import { computed } from 'vue'

import { buildOsmEmbedUrl } from '@/lib/osmEmbed'

const props = defineProps<{
  latitude: number
  longitude: number
  name: string
}>()

const embedUrl = computed(() => buildOsmEmbedUrl(props.latitude, props.longitude))
</script>

<template>
  <iframe
    :src="embedUrl"
    :title="`Map of ${props.name}`"
    style="width: 100%; height: 300px; border: none"
    data-testid="location-map"
  />
</template>
