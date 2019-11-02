export class Utils {
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static toSlug(str: string): string {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
    const to   = "aaaaaeeeeeiiiiooooouuuunc------";
    for (let i=0, l=from.length ; i<l ; i++) {
      str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes

    return str;
  }

  static gradients = [
    'background: #9D7AF7;\n' +
    'background: -webkit-linear-gradient(right, #9D7AF7, #1192B1);\n' +
    'background: -moz-linear-gradient(right, #9D7AF7, #1192B1);\n' +
    'background: linear-gradient(to left, #9D7AF7, #1192B1);',

    'background: #E04A82;\n' +
    'background: -webkit-linear-gradient(right, #E04A82, #5A2B57);\n' +
    'background: -moz-linear-gradient(right, #E04A82, #5A2B57);\n' +
    'background: linear-gradient(to left, #E04A82, #5A2B57);',

    'background: #005179;\n' +
    'background: -webkit-linear-gradient(right, #005179, #7A5CBA);\n' +
    'background: -moz-linear-gradient(right, #005179, #7A5CBA);\n' +
    'background: linear-gradient(to left, #005179, #7A5CBA);',

    'background: #95D5F1;\n' +
    'background: -webkit-linear-gradient(right, #95D5F1, #255A4A);\n' +
    'background: -moz-linear-gradient(right, #95D5F1, #255A4A);\n' +
    'background: linear-gradient(to left, #95D5F1, #255A4A);',

    'background: #E37A5E;\n' +
    'background: -webkit-linear-gradient(right, #E37A5E, #8907D6);\n' +
    'background: -moz-linear-gradient(right, #E37A5E, #8907D6);\n' +
    'background: linear-gradient(to left, #E37A5E, #8907D6);',

    'background: #93F74A;\n' +
    'background: -webkit-linear-gradient(right, #93F74A, #327093);\n' +
    'background: -moz-linear-gradient(right, #93F74A, #327093);\n' +
    'background: linear-gradient(to left, #93F74A, #327093);',

    'background: #6E3AF9;\n' +
    'background: -webkit-linear-gradient(right, #6E3AF9, #140E1E);\n' +
    'background: -moz-linear-gradient(right, #6E3AF9, #140E1E);\n' +
    'background: linear-gradient(to left, #6E3AF9, #140E1E);',

    'background: #E7C8C3;\n' +
    'background: -webkit-linear-gradient(right, #E7C8C3, #645427);\n' +
    'background: -moz-linear-gradient(right, #E7C8C3, #645427);\n' +
    'background: linear-gradient(to left, #E7C8C3, #645427);',

    'background: #BEB5C0;\n' +
    'background: -webkit-linear-gradient(right, #BEB5C0, #73585F);\n' +
    'background: -moz-linear-gradient(right, #BEB5C0, #73585F);\n' +
    'background: linear-gradient(to left, #BEB5C0, #73585F);',

    'background: #0F7559;\n' +
    'background: -webkit-linear-gradient(right, #0F7559, #949862);\n' +
    'background: -moz-linear-gradient(right, #0F7559, #949862);\n' +
    'background: linear-gradient(to left, #0F7559, #949862);',

    'background: #4D0F98;\n' +
    'background: -webkit-linear-gradient(right, #4D0F98, #119467);\n' +
    'background: -moz-linear-gradient(right, #4D0F98, #119467);\n' +
    'background: linear-gradient(to left, #4D0F98, #119467);',

    'background: #293171;\n' +
    'background: -webkit-linear-gradient(right, #293171, #647B82);\n' +
    'background: -moz-linear-gradient(right, #293171, #647B82);\n' +
    'background: linear-gradient(to left, #293171, #647B82);',

    'background: #F8D353;\n' +
    'background: -webkit-linear-gradient(right, #F8D353, #FF5C5A);\n' +
    'background: -moz-linear-gradient(right, #F8D353, #FF5C5A);\n' +
    'background: linear-gradient(to left, #F8D353, #FF5C5A);',

    'background: #D74F80;\n' +
    'background: -webkit-linear-gradient(right, #D74F80, #9241B5);\n' +
    'background: -moz-linear-gradient(right, #D74F80, #9241B5);\n' +
    'background: linear-gradient(to left, #D74F80, #9241B5);',

    'background: #CBC988;\n' +
    'background: -webkit-linear-gradient(right, #CBC988, #3F7890);\n' +
    'background: -moz-linear-gradient(right, #CBC988, #3F7890);\n' +
    'background: linear-gradient(to left, #CBC988, #3F7890);',

    'background: #B35D34;\n' +
    'background: -webkit-linear-gradient(right, #B35D34, #958B2A);\n' +
    'background: -moz-linear-gradient(right, #B35D34, #958B2A);\n' +
    'background: linear-gradient(to left, #B35D34, #958B2A);'
  ];
}