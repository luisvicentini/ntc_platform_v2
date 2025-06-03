import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"

import type { SessionToken } from "@/types/session"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("Iniciando processo de atualização de estabelecimento");
  console.log("Parâmetros recebidos:", params);
  
  try {
    // Verificação segura de ID
    const id = params?.id;
    console.log("ID do estabelecimento:", id);
    
    if (!id) {
      console.log("Erro: ID do estabelecimento não fornecido");
      return NextResponse.json(
        { error: "ID do estabelecimento não fornecido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Dados recebidos para atualização:", Object.keys(body));
    
    // Verificação de autenticação
    const sessionToken = request.headers.get("x-session-token");
    console.log("Token recebido:", sessionToken ? "Presente" : "Ausente");
    
    if (!sessionToken) {
      console.log("Erro: Sessão inválida - Token não fornecido");
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      );
    }
    
    // Decodificar o token
    let session;
    try {
      session = jwtDecode<SessionToken>(sessionToken);
      console.log("Sessão decodificada:", {
        uid: session.uid,
        userType: session.userType
      });
    } catch (tokenError: any) {
      console.error("Erro ao decodificar token:", tokenError);
      return NextResponse.json(
        { error: "Token de sessão inválido" },
        { status: 403 }
      );
    }
    
    // Verificação do estabelecimento
    try {
      const establishmentRef = doc(db, "establishments", id);
      const establishmentSnap = await getDoc(establishmentRef);
      
      if (!establishmentSnap.exists()) {
        console.log(`Erro: Estabelecimento ID ${id} não encontrado`);
        return NextResponse.json(
          { error: "Estabelecimento não encontrado" },
          { status: 404 }
        );
      }
      
      const establishmentData = establishmentSnap.data();
      console.log(`Estabelecimento encontrado: ${establishmentData.name || 'Nome não disponível'}`);
      
      // Verificação de permissões
      if (session.userType !== "master" && session.userType !== "partner") {
        console.log(`Erro: Usuário do tipo ${session.userType} sem permissão para editar estabelecimento`);
        return NextResponse.json(
          { error: "Sem permissão para editar este estabelecimento" },
          { status: 403 }
        );
      }
      
      // Atualizar estabelecimento
      console.log("Atualizando estabelecimento...");
      const updateData = {
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(establishmentRef, updateData);
      console.log(`Estabelecimento ID ${id} atualizado com sucesso`);
      
      return NextResponse.json({
        id,
        ...establishmentData,
        ...updateData
      });
      
    } catch (dbError: any) {
      console.error("Erro ao acessar banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao acessar o banco de dados", details: dbError.message },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error("Erro geral ao atualizar estabelecimento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar estabelecimento", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("Iniciando processo de exclusão permanente de estabelecimento");
  console.log("Parâmetros recebidos:", params);
  
  try {
    // Verificação segura de ID
    const id = params?.id;
    console.log("ID do estabelecimento:", id);
    
    if (!id) {
      console.log("Erro: ID do estabelecimento não fornecido");
      return NextResponse.json(
        { error: "ID do estabelecimento não fornecido" },
        { status: 400 }
      );
    }
    
    // Verificação de autenticação
    const sessionToken = request.headers.get("x-session-token");
    console.log("Token recebido:", sessionToken ? "Presente" : "Ausente");
    
    if (!sessionToken) {
      console.log("Erro: Sessão inválida - Token não fornecido");
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      );
    }
    
    // Decodificar o token
    let session;
    try {
      session = jwtDecode<SessionToken>(sessionToken);
      console.log("Sessão decodificada:", {
        uid: session.uid,
        userType: session.userType
      });
    } catch (tokenError: any) {
      console.error("Erro ao decodificar token:", tokenError);
      return NextResponse.json(
        { error: "Token de sessão inválido" },
        { status: 403 }
      );
    }
    
    // Verificação do estabelecimento
    try {
      const establishmentRef = doc(db, "establishments", id);
      const establishmentSnap = await getDoc(establishmentRef);
      
      if (!establishmentSnap.exists()) {
        console.log(`Erro: Estabelecimento ID ${id} não encontrado`);
        return NextResponse.json(
          { error: "Estabelecimento não encontrado" },
          { status: 404 }
        );
      }
      
      const establishmentData = establishmentSnap.data();
      console.log(`Estabelecimento encontrado: ${establishmentData.name || 'Nome não disponível'}`);
      
      // Verificação de permissões
      if (session.userType !== "master" && session.userType !== "partner") {
        console.log(`Erro: Usuário do tipo ${session.userType} sem permissão para excluir estabelecimento`);
        return NextResponse.json(
          { error: "Sem permissão para excluir este estabelecimento" },
          { status: 403 }
        );
      }
      
      // Excluir permanentemente o estabelecimento
      console.log(`Excluindo permanentemente o estabelecimento ID ${id}...`);
      await deleteDoc(establishmentRef);
      
      console.log(`Estabelecimento ID ${id} excluído permanentemente com sucesso`);
      return NextResponse.json({ 
        message: "Estabelecimento excluído permanentemente com sucesso",
        deleted: true
      });
      
    } catch (dbError: any) {
      console.error("Erro ao acessar banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao acessar o banco de dados", details: dbError.message },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error("Erro geral ao excluir estabelecimento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir estabelecimento", details: error.message },
      { status: 500 }
    );
  }
}

// Atualizar a configuração dinâmica para Next.js
export const dynamic = 'force-dynamic'
export const dynamicParams = true
