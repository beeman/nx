import { Rule, Tree } from '@angular-devkit/schematics';
import { addGlobal, insert, toPropertyName } from '@nrwl/workspace';
import { insertImport } from '@nrwl/workspace/src/utils/ast-utils';
import * as ts from 'typescript';
import { addImportToModule } from '@nrwl/workspace/src/utils/decorator-ast-utils';
import { NormalizedSchema } from './normalized-schema';

export function addRouterConfiguration(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const moduleSource = host.read(options.modulePath)!.toString('utf-8');
    const moduleSourceFile = ts.createSourceFile(
      options.modulePath,
      moduleSource,
      ts.ScriptTarget.Latest,
      true
    );
    const constName = `${toPropertyName(options.fileName)}Routes`;

    insert(host, options.modulePath, [
      insertImport(
        moduleSourceFile,
        options.modulePath,
        'RouterModule, Route',
        '@angular/router'
      ),
      ...addImportToModule(
        moduleSourceFile,
        options.modulePath,
        `RouterModule`
      ),
      ...addGlobal(
        moduleSourceFile,
        options.modulePath,
        `export const ${constName}: Route[] = [];`
      ),
    ]);
    return host;
  };
}
