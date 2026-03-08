declare module '@event-calendar/core' {
	export const Calendar: any;
	export const DayGrid: any;
	export const Interaction: any;
	export function createCalendar(target: HTMLElement, plugins: any[], options: any): any;
	export function destroyCalendar(calendar: any): void;
}

declare module '@event-calendar/core/index.css';
