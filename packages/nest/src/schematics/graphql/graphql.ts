import {
  apply,
  branchAndMerge,
  chain,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { formatFiles, insert } from '@nrwl/workspace';

import { insertImport } from '@nrwl/workspace/src/utils/ast-utils';
import * as path from 'path';

import {
  addImportToModule,
  addProviderToModule,
  readBootstrapInfo,
} from '../../utils/ast-utils';
import { addGraphQLToPackageJson } from '../../utils/graphql';
import { Schema } from './schema';

function addImportsToModule(options: Schema): Rule {
  return (host: Tree) => {
    const {
      modulePath,
      moduleSource,
      resolverFileName,
      resolverClassName,
    } = readBootstrapInfo(host, options.project);

    insert(host, modulePath, [
      insertImport(
        moduleSource,
        modulePath,
        'GraphQLModule',
        '@nestjs/graphql'
      ),
      insertImport(
        moduleSource,
        modulePath,
        resolverClassName,
        `./${resolverFileName}.resolver`
      ),
      ...addImportToModule(
        moduleSource,
        modulePath,
        'GraphQLModule.forRoot({ autoSchemaFile: true })'
      ),
      ...addProviderToModule(moduleSource, modulePath, resolverClassName),
    ]);

    return host;
  };
}

function addTasks(options: Schema) {
  return (host: Tree, context: SchematicContext) => {
    if (!options.skipInstall) {
      context.addTask(new NodePackageInstallTask('.'));
    }
  };
}

function createFiles(options: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const {
      modulePath,
      resolverClassName,
      resolverFileName,
    } = readBootstrapInfo(host, options.project);

    const dir = path.dirname(modulePath);
    const templateSource = apply(url('./files'), [
      template({
        ...options,
        tmpl: '',
        className: resolverClassName,
        fileName: resolverFileName,
      }),
      move(dir),
    ]);
    const r = branchAndMerge(chain([mergeWith(templateSource)]));
    return r(host, context);
  };
}

export default function (options: Schema): Rule {
  return () => {
    return chain([
      createFiles(options),
      addImportsToModule(options),
      options.skipPackageJson ? noop() : addGraphQLToPackageJson(),
      addTasks(options),
      formatFiles(options),
    ]);
  };
}
