export class Browser {

  /**
   * Add URL parameters to the web app URL.
   * @param params - the parameters to add
   */
  static addUrlParams(params): void {
    const combinedParams = Object.assign(this.getUrlParams(), params);
    const serializedParams = Object.entries(combinedParams)
      .map(([name, value]) => `${name}=${encodeURIComponent(value as string)}`)
      .join('&');
    history.pushState(null, '', `${window.location.pathname}?${serializedParams}`);
  }

  /**
   * Generate an object map of URL parameters.
   * @returns {*}
   */
  static getUrlParams(): object {
    const serializedParams: string = window.location.search.split('?')[1];
    const nvpairs: string[] = serializedParams ? serializedParams.split('&') : [];
    return nvpairs.reduce((params, nvpair) => {
      const [name, value] = nvpair.split('=');
      params[name] = decodeURIComponent(value);
      return params;
    }, {});
  }

  /**
   * Whether the web app is running on a mobile browser.
   * @type {boolean}
   */
  static isMobile(): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
      return false;
    }
    return /Mobile/.test(navigator.userAgent);
  }
}