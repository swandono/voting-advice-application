// eslint-disable-next-line @typescript-eslint/no-require-imports
const aws = require('@aws-sdk/client-ses');

export default ({ env }) => {
  const isDev = env('NODE_ENV') === 'development';
  const emailProvider = env('EMAIL_PROVIDER', 'smtp');
  const uploadProvider = env('UPLOAD_PROVIDER', 'local');

  const smtpProviderOptions = () => {
    const host = env('SMTP_HOST');
    const port = env.int('SMTP_PORT', 587);
    const secure = env.bool('SMTP_SECURE', port === 465);
    const user = env('SMTP_USER');
    const pass = env('SMTP_PASS');

    if (!host) return undefined;

    const base = { host, port, secure };
    if (user && pass) {
      return { ...base, auth: { user, pass } };
    }
    return base;
  };

  const emailConfig = () => {
    if (emailProvider === 'ses') {
      return {
        provider: 'nodemailer',
        providerOptions: {
          SES: {
            ses: new aws.SES({
              endpoint: env('LOCALSTACK_ENDPOINT'),
              apiVersion: '2010-12-01',
              region: env('AWS_SES_REGION'),
              credentials: {
                accessKeyId: env('AWS_SES_ACCESS_KEY_ID'),
                secretAccessKey: env('AWS_SES_SECRET_ACCESS_KEY')
              }
            }),
            aws
          },
          // max 14 messages per second to comply with AWS SES
          sendingRate: 14
        },
        settings: {
          defaultFrom: env('MAIL_FROM'),
          defaultReplyTo: env('MAIL_REPLY_TO')
        }
      };
    }

    const smtpOptions = smtpProviderOptions();
    if (!smtpOptions) return undefined;

    return {
      provider: 'nodemailer',
      providerOptions: smtpOptions,
      settings: {
        defaultFrom: env('MAIL_FROM'),
        defaultReplyTo: env('MAIL_REPLY_TO')
      }
    };
  };

  const uploadConfig = () => {
    if (uploadProvider === 's3') {
      return {
        provider: 'aws-s3',
        providerOptions: {
          /*
           * The base URL on production uses a dedicated subdomain which is linked to AWS S3 bucket via CNAME DNS record.
           **/
          baseUrl: isDev ? `${env('STATIC_CONTENT_BASE_URL')}/${env('AWS_S3_BUCKET')}` : env('STATIC_CONTENT_BASE_URL'),
          rootPath: env('STATIC_MEDIA_CONTENT_PATH'),
          s3Options: {
            /*
             * In development we use local AWS - LocalStack.
             **/
            endpoint: isDev ? env('LOCALSTACK_ENDPOINT') : undefined,
            /*
             * In development we want to use "Path" style S3 URLs, since
             * Docker services run locally are unable to resolve "Virtual-Hosted" style S3 URLs.
             * https://docs.localstack.cloud/user-guide/aws/s3/#path-style-and-virtual-hosted-style-requests
             *
             **/
            forcePathStyle: isDev,
            credentials: {
              accessKeyId: env('AWS_S3_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_S3_ACCESS_SECRET')
            },
            region: env('AWS_S3_REGION'),
            params: {
              ACL: 'private',
              Bucket: env('AWS_S3_BUCKET')
            }
          },
          sizeLimit: 20 * 1024 * 1024 // ~20mb in bytes
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {}
        }
      };
    }

    return {
      provider: 'local',
      providerOptions: {
        sizeLimit: 20 * 1024 * 1024 // ~20mb in bytes
      }
    };
  };

  const resolvedEmailConfig = emailConfig();

  return {
    'users-permissions': {
      config: {
        jwt: {
          expiresIn: '4h'
        },
        register: {
          allowedFields: ['candidate']
        }
      }
    },
    ...(resolvedEmailConfig ? { email: { config: resolvedEmailConfig } } : {}),
    upload: {
      config: {
        ...uploadConfig()
      }
    },
    'openvaa-admin-tools': {
      enabled: true,
      resolve: './src/plugins/openvaa-admin-tools'
    }
  };
};
