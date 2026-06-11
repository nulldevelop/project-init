import type { ProjectConfig } from "../types";

export function getVercelJson(): string {
  return JSON.stringify({ framework: "nextjs", buildCommand: "pnpm build", installCommand: "pnpm install" }, null, 2);
}

export function getEcosystemConfig(config: ProjectConfig): string {
  return `module.exports = {
  apps: [
    {
      name: "${config.name}",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
`;
}

export function getNginxConf(config: ProjectConfig): string {
  return `server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
}

export function getWebConfig(config: ProjectConfig): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="node_modules/.bin/next" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^node_modules/\.bin\/next\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{{REQUEST_URI}}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{{REQUEST_FILENAME}}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="node_modules/.bin/next" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin" />
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode node_env="%node_env%" watchedFiles="web.config;*.js" loggingEnabled="true" devErrorsEnabled="false" />
  </system.webServer>
</configuration>
`;
}
