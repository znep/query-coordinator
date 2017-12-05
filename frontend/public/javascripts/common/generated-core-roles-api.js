"use strict";
/// <reference path="./custom.d.ts" />
// tslint:disable
/**
 * Roles and Rights API
 * API for configurable roles and rights
 *
 * OpenAPI spec version: 1.0.0
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var url = require("url");
var portableFetch = require("portable-fetch");
var BASE_PATH = "http://localhost".replace(/\/+$/, "");
/**
 *
 * @export
 */
exports.COLLECTION_FORMATS = {
    csv: ",",
    ssv: " ",
    tsv: "\t",
    pipes: "|",
};
/**
 *
 * @export
 * @class BaseAPI
 */
var BaseAPI = /** @class */ (function () {
    function BaseAPI(configuration, basePath, fetch) {
        if (basePath === void 0) { basePath = BASE_PATH; }
        if (fetch === void 0) { fetch = portableFetch; }
        this.basePath = basePath;
        this.fetch = fetch;
        if (configuration) {
            this.configuration = configuration;
            this.basePath = configuration.basePath || this.basePath;
        }
    }
    return BaseAPI;
}());
exports.BaseAPI = BaseAPI;
;
/**
 *
 * @export
 * @class RequiredError
 * @extends {Error}
 */
var RequiredError = /** @class */ (function (_super) {
    __extends(RequiredError, _super);
    function RequiredError(field, msg) {
        var _this = _super.call(this, msg) || this;
        _this.field = field;
        return _this;
    }
    return RequiredError;
}(Error));
exports.RequiredError = RequiredError;
/**
 * DefaultApi - fetch parameter creator
 * @export
 */
exports.DefaultApiFetchParamCreator = function (configuration) {
    return {
        /**
         * Set the role for a user. If the user already has a role, their role will be changed to the given role.
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        assignRoleToUser: function (userId, roleId, options) {
            if (options === void 0) { options = {}; }
            // verify required parameter 'userId' is not null or undefined
            if (userId === null || userId === undefined) {
                throw new RequiredError('userId', 'Required parameter userId was null or undefined when calling assignRoleToUser.');
            }
            // verify required parameter 'roleId' is not null or undefined
            if (roleId === null || roleId === undefined) {
                throw new RequiredError('roleId', 'Required parameter roleId was null or undefined when calling assignRoleToUser.');
            }
            var localVarPath = "/api/roles/{role-id}/users/{user-id}"
                .replace("{" + "user-id" + "}", encodeURIComponent(String(userId)))
                .replace("{" + "role-id" + "}", encodeURIComponent(String(roleId)));
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'PUT' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Post a new custom `Role` for this domain.
         * @param {Body} [body]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createRole: function (body, options) {
            if (options === void 0) { options = {}; }
            var localVarPath = "/api/roles";
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'POST' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarHeaderParameter['Content-Type'] = 'application/json';
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            localVarRequestOptions.body = JSON.stringify(body || {});
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Delete a specific `Role` object for the domain. Note that while a `Role` has users assigned to it, it can not be deleted.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteRole: function (roleId, options) {
            if (options === void 0) { options = {}; }
            // verify required parameter 'roleId' is not null or undefined
            if (roleId === null || roleId === undefined) {
                throw new RequiredError('roleId', 'Required parameter roleId was null or undefined when calling deleteRole.');
            }
            var localVarPath = "/api/roles/{role-id}"
                .replace("{" + "role-id" + "}", encodeURIComponent(String(roleId)));
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'DELETE' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get all of the rights categories on the domain.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRights: function (options) {
            if (options === void 0) { options = {}; }
            var localVarPath = "/api/rights";
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get all `Role` objects for domain.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRoles: function (options) {
            if (options === void 0) { options = {}; }
            var localVarPath = "/api/roles";
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get a specific `Role` object for the domain.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRole: function (roleId, options) {
            if (options === void 0) { options = {}; }
            // verify required parameter 'roleId' is not null or undefined
            if (roleId === null || roleId === undefined) {
                throw new RequiredError('roleId', 'Required parameter roleId was null or undefined when calling getRole.');
            }
            var localVarPath = "/api/roles/{role-id}"
                .replace("{" + "role-id" + "}", encodeURIComponent(String(roleId)));
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get the role for a user
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserRole: function (userId, options) {
            if (options === void 0) { options = {}; }
            // verify required parameter 'userId' is not null or undefined
            if (userId === null || userId === undefined) {
                throw new RequiredError('userId', 'Required parameter userId was null or undefined when calling getUserRole.');
            }
            var localVarPath = "/api/users/{user-id}/role"
                .replace("{" + "user-id" + "}", encodeURIComponent(String(userId)));
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get users with the given role
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUsersWithRole: function (roleId, options) {
            if (options === void 0) { options = {}; }
            // verify required parameter 'roleId' is not null or undefined
            if (roleId === null || roleId === undefined) {
                throw new RequiredError('roleId', 'Required parameter roleId was null or undefined when calling getUsersWithRole.');
            }
            var localVarPath = "/api/roles/{role-id}/users"
                .replace("{" + "role-id" + "}", encodeURIComponent(String(roleId)));
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Remove the role from a user.
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        removeRoleFromUser: function (userId, roleId, options) {
            if (options === void 0) { options = {}; }
            // verify required parameter 'userId' is not null or undefined
            if (userId === null || userId === undefined) {
                throw new RequiredError('userId', 'Required parameter userId was null or undefined when calling removeRoleFromUser.');
            }
            // verify required parameter 'roleId' is not null or undefined
            if (roleId === null || roleId === undefined) {
                throw new RequiredError('roleId', 'Required parameter roleId was null or undefined when calling removeRoleFromUser.');
            }
            var localVarPath = "/api/roles/{role-id}/users/{user-id}"
                .replace("{" + "user-id" + "}", encodeURIComponent(String(userId)))
                .replace("{" + "role-id" + "}", encodeURIComponent(String(roleId)));
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'DELETE' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Update a specific `Role` object for the domain.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {Body1} body
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        updateRole: function (roleId, body, options) {
            if (options === void 0) { options = {}; }
            // verify required parameter 'roleId' is not null or undefined
            if (roleId === null || roleId === undefined) {
                throw new RequiredError('roleId', 'Required parameter roleId was null or undefined when calling updateRole.');
            }
            // verify required parameter 'body' is not null or undefined
            if (body === null || body === undefined) {
                throw new RequiredError('body', 'Required parameter body was null or undefined when calling updateRole.');
            }
            var localVarPath = "/api/roles/{role-id}"
                .replace("{" + "role-id" + "}", encodeURIComponent(String(roleId)));
            var localVarUrlObj = url.parse(localVarPath, true);
            var localVarRequestOptions = Object.assign({ method: 'PUT' }, options);
            var localVarHeaderParameter = {};
            var localVarQueryParameter = {};
            localVarHeaderParameter['Content-Type'] = 'application/json';
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            localVarRequestOptions.body = JSON.stringify(body || {});
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    };
};
/**
 * DefaultApi - functional programming interface
 * @export
 */
exports.DefaultApiFp = function (configuration) {
    return {
        /**
         * Set the role for a user. If the user already has a role, their role will be changed to the given role.
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        assignRoleToUser: function (userId, roleId, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).assignRoleToUser(userId, roleId, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Post a new custom `Role` for this domain.
         * @param {Body} [body]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createRole: function (body, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).createRole(body, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Delete a specific `Role` object for the domain. Note that while a `Role` has users assigned to it, it can not be deleted.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteRole: function (roleId, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).deleteRole(roleId, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response;
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Get all of the rights categories on the domain.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRights: function (options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).getAllRights(options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Get all `Role` objects for domain.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRoles: function (options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).getAllRoles(options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Get a specific `Role` object for the domain.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRole: function (roleId, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).getRole(roleId, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Get the role for a user
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserRole: function (userId, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).getUserRole(userId, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Get users with the given role
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUsersWithRole: function (roleId, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).getUsersWithRole(roleId, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Remove the role from a user.
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        removeRoleFromUser: function (userId, roleId, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).removeRoleFromUser(userId, roleId, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Update a specific `Role` object for the domain.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {Body1} body
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        updateRole: function (roleId, body, options) {
            var localVarFetchArgs = exports.DefaultApiFetchParamCreator(configuration).updateRole(roleId, body, options);
            return function (fetch, basePath) {
                if (fetch === void 0) { fetch = portableFetch; }
                if (basePath === void 0) { basePath = BASE_PATH; }
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
    };
};
/**
 * DefaultApi - factory interface
 * @export
 */
exports.DefaultApiFactory = function (configuration, fetch, basePath) {
    return {
        /**
         * Set the role for a user. If the user already has a role, their role will be changed to the given role.
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        assignRoleToUser: function (userId, roleId, options) {
            return exports.DefaultApiFp(configuration).assignRoleToUser(userId, roleId, options)(fetch, basePath);
        },
        /**
         * Post a new custom `Role` for this domain.
         * @param {Body} [body]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createRole: function (body, options) {
            return exports.DefaultApiFp(configuration).createRole(body, options)(fetch, basePath);
        },
        /**
         * Delete a specific `Role` object for the domain. Note that while a `Role` has users assigned to it, it can not be deleted.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteRole: function (roleId, options) {
            return exports.DefaultApiFp(configuration).deleteRole(roleId, options)(fetch, basePath);
        },
        /**
         * Get all of the rights categories on the domain.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRights: function (options) {
            return exports.DefaultApiFp(configuration).getAllRights(options)(fetch, basePath);
        },
        /**
         * Get all `Role` objects for domain.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAllRoles: function (options) {
            return exports.DefaultApiFp(configuration).getAllRoles(options)(fetch, basePath);
        },
        /**
         * Get a specific `Role` object for the domain.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRole: function (roleId, options) {
            return exports.DefaultApiFp(configuration).getRole(roleId, options)(fetch, basePath);
        },
        /**
         * Get the role for a user
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserRole: function (userId, options) {
            return exports.DefaultApiFp(configuration).getUserRole(userId, options)(fetch, basePath);
        },
        /**
         * Get users with the given role
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUsersWithRole: function (roleId, options) {
            return exports.DefaultApiFp(configuration).getUsersWithRole(roleId, options)(fetch, basePath);
        },
        /**
         * Remove the role from a user.
         * @param {string} userId The &#x60;User&#x60; identifier (4x4)
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        removeRoleFromUser: function (userId, roleId, options) {
            return exports.DefaultApiFp(configuration).removeRoleFromUser(userId, roleId, options)(fetch, basePath);
        },
        /**
         * Update a specific `Role` object for the domain.
         * @param {string} roleId The &#x60;Role&#x60; identifier (UUID)
         * @param {Body1} body
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        updateRole: function (roleId, body, options) {
            return exports.DefaultApiFp(configuration).updateRole(roleId, body, options)(fetch, basePath);
        },
    };
};
/**
 * DefaultApi - object-oriented interface
 * @export
 * @class DefaultApi
 * @extends {BaseAPI}
 */
var DefaultApi = /** @class */ (function (_super) {
    __extends(DefaultApi, _super);
    function DefaultApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Set the role for a user. If the user already has a role, their role will be changed to the given role.
     * @param {} userId The &#x60;User&#x60; identifier (4x4)
     * @param {} roleId The &#x60;Role&#x60; identifier (UUID)
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.assignRoleToUser = function (userId, roleId, options) {
        return exports.DefaultApiFp(this.configuration).assignRoleToUser(userId, roleId, options)(this.fetch, this.basePath);
    };
    /**
     * Post a new custom `Role` for this domain.
     * @param {} [body]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.createRole = function (body, options) {
        return exports.DefaultApiFp(this.configuration).createRole(body, options)(this.fetch, this.basePath);
    };
    /**
     * Delete a specific `Role` object for the domain. Note that while a `Role` has users assigned to it, it can not be deleted.
     * @param {} roleId The &#x60;Role&#x60; identifier (UUID)
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.deleteRole = function (roleId, options) {
        return exports.DefaultApiFp(this.configuration).deleteRole(roleId, options)(this.fetch, this.basePath);
    };
    /**
     * Get all of the rights categories on the domain.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.getAllRights = function (options) {
        return exports.DefaultApiFp(this.configuration).getAllRights(options)(this.fetch, this.basePath);
    };
    /**
     * Get all `Role` objects for domain.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.getAllRoles = function (options) {
        return exports.DefaultApiFp(this.configuration).getAllRoles(options)(this.fetch, this.basePath);
    };
    /**
     * Get a specific `Role` object for the domain.
     * @param {} roleId The &#x60;Role&#x60; identifier (UUID)
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.getRole = function (roleId, options) {
        return exports.DefaultApiFp(this.configuration).getRole(roleId, options)(this.fetch, this.basePath);
    };
    /**
     * Get the role for a user
     * @param {} userId The &#x60;User&#x60; identifier (4x4)
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.getUserRole = function (userId, options) {
        return exports.DefaultApiFp(this.configuration).getUserRole(userId, options)(this.fetch, this.basePath);
    };
    /**
     * Get users with the given role
     * @param {} roleId The &#x60;Role&#x60; identifier (UUID)
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.getUsersWithRole = function (roleId, options) {
        return exports.DefaultApiFp(this.configuration).getUsersWithRole(roleId, options)(this.fetch, this.basePath);
    };
    /**
     * Remove the role from a user.
     * @param {} userId The &#x60;User&#x60; identifier (4x4)
     * @param {} roleId The &#x60;Role&#x60; identifier (UUID)
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.removeRoleFromUser = function (userId, roleId, options) {
        return exports.DefaultApiFp(this.configuration).removeRoleFromUser(userId, roleId, options)(this.fetch, this.basePath);
    };
    /**
     * Update a specific `Role` object for the domain.
     * @param {} roleId The &#x60;Role&#x60; identifier (UUID)
     * @param {} body
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    DefaultApi.prototype.updateRole = function (roleId, body, options) {
        return exports.DefaultApiFp(this.configuration).updateRole(roleId, body, options)(this.fetch, this.basePath);
    };
    return DefaultApi;
}(BaseAPI));
exports.DefaultApi = DefaultApi;
