import type { CSSProperties } from 'react';
import {
  Browsers,
  DeviceMobile,
  Megaphone,
  PlugsConnected,
  Rocket,
  type Icon,
} from '@phosphor-icons/react';

/**
 * Maps the design's Phosphor class strings (e.g. "ph-fill ph-browsers") to the
 * React icon components. Projects store the class string; this resolves it.
 */
const ICON_MAP: Record<string, Icon> = {
  browsers: Browsers,
  'device-mobile': DeviceMobile,
  'plugs-connected': PlugsConnected,
  megaphone: Megaphone,
  rocket: Rocket,
};

export const PROJECT_ICON_OPTIONS = [
  { value: 'ph-fill ph-browsers', label: 'Browser' },
  { value: 'ph-fill ph-device-mobile', label: 'Mobile' },
  { value: 'ph-fill ph-plugs-connected', label: 'API' },
  { value: 'ph-fill ph-megaphone', label: 'Marketing' },
  { value: 'ph-fill ph-rocket', label: 'Launch' },
];

function parse(name: string): { Comp: Icon; fill: boolean } {
  const key = name.replace(/ph-fill|ph-bold|ph-/g, '').trim();
  return { Comp: ICON_MAP[key] ?? Browsers, fill: name.includes('fill') };
}

export function PhIcon({
  name,
  size = 18,
  style,
  className,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const { Comp, fill } = parse(name);
  return <Comp size={size} weight={fill ? 'fill' : 'regular'} style={style} className={className} />;
}
