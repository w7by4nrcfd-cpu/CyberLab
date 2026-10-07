import type { ComponentProps } from 'react';

// Native navigation avoids the client router failure in the deployed Vinext build.
export default function Link({ href, ...props }: ComponentProps<'a'> & { href: string }) {
  return <a href={href} {...props} />;
}
