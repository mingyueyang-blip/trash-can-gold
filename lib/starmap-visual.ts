/**
 * 星图视觉标准 (Galaxy Visual Standard)
 * 淬炼内星图与 Dock 全库星图共用
 */

export const NODE_R = 2;
export const LABEL_OFFSET_PX = 5;
export const FONT_SIZE_PX = 8;
/** Dock 全库星图：字体更大，方便点击 */
export const FONT_SIZE_PX_DOCK = 12;

/** 笔记标题（中心节点、@引用）：粉色，加粗 */
export const TITLE_LABEL_COLOR = "#F472B6";

/** 标签名称：黑色 */
export const TAG_LABEL_COLOR = "#1a1a1a";

export const CENTER_NODE_COLOR = "rgba(255,255,255,0.95)";
/** 全库星图里「笔记标题」节点与淬炼内中心/引用节点同色 */
export const TITLE_NODE_COLOR = CENTER_NODE_COLOR;
export const TAG_NODE_COLOR = "rgba(200, 180, 230, 0.95)";
export const LINK_STROKE = "rgba(200, 180, 230, 0.5)";

/** 斥力强度（越大节点越散开，背景渐变紫可透出） */
export const CHARGE_STRENGTH = -720;

/** 碰撞半径（避免文字重叠） */
export const COLLIDE_RADIUS = 24;
