import fs from 'fs';
import yaml from 'js-yaml';
import { PerpetuoConfig, PerpetuoConfigSchema } from '@perpetuo/core';
import path from 'path';

export function loadConfig(configPath?: string): PerpetuoConfig {
    const p = configPath || process.env.PERPETUO_CONFIG_PATH || path.resolve('../../perpetuo.config.yaml');

    if (!fs.existsSync(p)) {
        throw new Error(`Config file not found at ${p}`);
    }

    const raw = fs.readFileSync(p, 'utf8');
    const parsed = yaml.load(raw);

    return PerpetuoConfigSchema.parse(parsed);
}
