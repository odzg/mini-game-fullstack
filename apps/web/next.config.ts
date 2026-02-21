import type { WithNxOptions } from '@nx/next/plugins/with-nx';

import { composePlugins, withNx } from '@nx/next';

const nextConfig: WithNxOptions = {
  nx: {},
};

export default composePlugins(withNx)(nextConfig);
