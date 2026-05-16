import type { JsonSchema } from '../types/schema';

// Initial State exactly as the image from C6 Bank
export const initialSchema: JsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  title: "corporate-services.c6availability-service.product-status.changed",
  description: "This event reports a product status change indicating whether it is available or not",
  additionalProperties: false,
  properties: {
    "product_id": { type: "integer", description: "Product identification" },
    "product_name": { type: "string", description: "Product name" },
    "allowed_volume": { type: "integer", description: "Percentage of volume allowed for the product" },
    "status": { type: "string", enum: ["AVAILABLE", "UNAVAILABLE"], description: "Product status" },
    "switch": { type: "string", enum: ["PRODUCT", "CHANNEL", "GENERAL"], description: "Scope of unavailability" },
    "title": { type: "string", description: "Title shown on the unavailability screen" },
    "message": { type: "string", description: "Message shown on the unavailability screen" },
    "tapume_up_time": { type: "string", description: "When the siding went up" },
    "tapume_down_time": { type: "string", description: "When the siding was removed" },
    "devices_attempted": { type: "integer", description: "Number of devices attempted" }
  },
  required: ["product_id", "product_name", "allowed_volume", "status", "switch"]
};

export const initialPayload = JSON.stringify({
  product_id: 12345,
  product_name: "Cartão de Crédito",
  allowed_volume: 100,
  status: "UNAVAILABLE",
  switch: "CHANNEL"
}, null, 2);
