import * as ts from "typescript";
import CompilerApiHelper, { deserializeTypeObject, TypeObject } from 'compiler-api-helper'
import { serializeTypeObject } from 'compiler-api-helper'

const typeObjectToText = (typeObject: TypeObject) => {
    let count = 0
  
    const getTypeText = async (typeObject: TypeObject): Promise<string> => {
      if (typeObject.__type === 'LiteralTO')
        return typeof typeObject.value === 'string'
          ? `"${typeObject.value}"`
          : `${typeObject.value}`
      if (typeObject.__type === 'EnumTO')
        return (
          await Promise.all(typeObject.enums.map(({ type }) => getTypeText(type)))
        ).join(' | ')
      if (typeObject.__type === 'UnionTO')
        return (
          await Promise.all(
            typeObject.unions.map(async (type) =>
              type.__type === 'CallableTO' || type.__type === 'UnsupportedTO'
                ? `(${await getTypeText(type)})`
                : await getTypeText(type),
            ),
          )
        ).join(' | ')
      if (typeObject.__type === 'ArrayTO')
        return `Array<${await getTypeText(typeObject.child)}>`
      if (typeObject.__type === 'ObjectTO') {
        count += 1
        if (count > 15) {
          return `{}`
        }
  
        const props = await client()
          .getObjectProps.query({
            storeKey: typeObject.storeKey,
          })
          .then(
            async (props) =>
              await Promise.all(
                props.map(async (prop) => ({
                  propName: prop.propName,
                  typeText: await getTypeText(deserializeTypeObject(prop.type)),
                })),
              ),
          )
  
        return (
          '{ ' +
          props
            .map(({ propName, typeText }) => `'${propName}': ${typeText}`)
            .join(', ') +
          ' }'
        )
      }
      if (typeObject.__type === 'CallableTO') {
        const argTypes = (
          await Promise.all(
            typeObject.argTypes.map(
              async ({ name, type }) => `${name}: ${await getTypeText(type)}`,
            ),
          )
        ).join(', ')
        const returnType = await getTypeText(typeObject.returnType)
        return `(${argTypes}) => ${returnType}`
      }
      if (typeObject.__type === 'PromiseTO')
        return `Promise<${await getTypeText(typeObject.child)}>`
      if (typeObject.__type === 'PromiseLikeTO')
        return `PromiseLike<${await getTypeText(typeObject.child)}>`
      if (typeObject.__type === 'PrimitiveTO') return typeObject.kind
      if (typeObject.__type === 'SpecialTO') return typeObject.kind
      if (typeObject.__type === 'UnsupportedTO') return 'unknown'
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (typeObject.__type === 'TupleTO')
        return `[${(await Promise.all(typeObject.items.map(typeObjectToText))).join(', ')}]`
      typeObject satisfies never
      throw new Error('unreachable here')
    }
  
    return getTypeText(typeObject)
  }

function extractTypeSignature(filename: string, aliasName: string, shiftGeneric: number = 1): string {

    const program: ts.Program = ts.createProgram([ filename ], { emitDeclarationOnly: true });
    const helper = new CompilerApiHelper(program);
    const sourceFile: ts.SourceFile | undefined = program.getSourceFile(filename);
    if (!sourceFile) {
        throw new Error(`File: ${filename} not found!`);
    }
    const typeChecker: ts.TypeChecker = program.getTypeChecker();
    const statement: ts.Statement | undefined = sourceFile.statements.find(
      (s) => ts.isTypeAliasDeclaration(s) && s.name.text === aliasName
    );
    if (!statement) {
        throw new Error(`Type: '${aliasName}' not found in file: '${filename}'`);
    }
    const type: ts.Type = typeChecker.getTypeAtLocation(statement);
    // console.log(typeChecker.typeToString(type));
    const fields: string[] = [];
    // // Iterate over the `ts.Symbol`s representing Property Nodes of `ts.Type`
    // return helper.convertType(type);
    for (const prop of type.getProperties()) {
        const name: string = prop.getName();
        const propType: ts.Type = typeChecker.getTypeOfSymbolAtLocation(prop, statement);
        const signature = propType.getCallSignatures()[0];
        const parameters = typeChecker.getExpandedParameters(signature)[0].slice(1);
        const returnType = signature.declaration?.type;
        const patched = {
            ...propType,
            callSignatures: [{
                typeParameters: signature.typeParameters?.slice(1),
                flags: 0,
                parameters,
                declaration: {
                    ...signature.declaration,
                    type: returnType
                }
            }]
        };
        // const propTypeName: string = typeChecker.typeToString(propType);
        console.log(typeObjectToText(helper.convertType(propType)));
        // fields.push(`${name}: ${propTypeName};`);
    }
    // return `type ${aliasName} = {\n  ${fields.join("\n  ")}\n}`;
}

// console.log(extractTypeSignature("./src/_helper.ts", "Acc"));
console.log(extractTypeSignature("./src/_helper.ts", "Gen", 0));
// console.log(extractTypeSignature("./src/_helper.ts", "SGen", 0));