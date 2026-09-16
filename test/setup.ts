import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vitest runs without globals here, so RTL never registers its own auto
// cleanup and every render would stack up in the same document.
afterEach(cleanup);
