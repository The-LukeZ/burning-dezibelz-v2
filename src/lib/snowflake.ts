import { Snowflake } from "@sapphire/snowflake";

const BD_EPOCH = new Date("2023-01-01T00:00:00.000Z");

// Create your custom snowflake class
class BDSnowflake extends Snowflake {
  constructor() {
    super(BD_EPOCH);
  }
}

export { BDSnowflake };
