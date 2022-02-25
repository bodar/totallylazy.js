export class Spaces {
    static codes: string[] = [32, 160, 8239].map(code => String.fromCharCode(code));
    static spaces = Spaces.codes.join('');
    static pattern = new RegExp(`[${Spaces.spaces}]`, 'g');

    static handle(value: string): string {
        return Spaces.codes.indexOf(value) != -1 ? Spaces.spaces : value;
    }
}