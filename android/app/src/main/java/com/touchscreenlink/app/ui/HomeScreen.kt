package com.touchscreenlink.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.touchscreenlink.app.model.DiscoveredHost
import com.touchscreenlink.app.model.StreamConfig
import com.touchscreenlink.app.model.StreamProfile
import com.touchscreenlink.app.network.BluetoothTransportManager
import com.touchscreenlink.app.network.DiscoveryClient

@Composable
fun HomeScreen(
    config: StreamConfig,
    onConfigChange: (StreamConfig) -> Unit,
    keepScreenOn: Boolean,
    onKeepScreenOnChange: (Boolean) -> Unit,
    bluetoothManager: BluetoothTransportManager,
    onConnect: (DiscoveredHost) -> Unit
) {
    var discoveredHosts by remember { mutableStateOf<List<DiscoveredHost>>(emptyList()) }
    var isManualDialogVisible by remember { mutableStateOf(false) }
    var manualIp by remember { mutableStateOf("192.168.1.100") }

    val discoveryClient = remember {
        DiscoveryClient { newHost ->
            if (discoveredHosts.none { it.id == newHost.id }) {
                discoveredHosts = discoveredHosts + newHost
            }
        }
    }

    LaunchedEffect(Unit) {
        discoveryClient.startListening()
        discoveryClient.sendDiscoveryProbe()
    }

    DisposableEffect(Unit) {
        onDispose {
            discoveryClient.stop()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp)
    ) {
        // Cabeçalho
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "TouchScreen Link",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Transforme este aparelho em tela de toque para seu PC",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8)
                )
            }

            IconButton(
                onClick = { discoveryClient.sendDiscoveryProbe() },
                modifier = Modifier.background(Color(0xFF1E293B), CircleShape)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Atualizar", tint = Color(0xFF38BDF8))
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Lista de Dispositivos Detectados
        Text(
            text = "Computadores Windows Detectados na Rede:",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFFCBD5E1)
        )

        Spacer(modifier = Modifier.height(10.dp))

        if (discoveredHosts.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .background(Color(0xFF1E293B), RoundedCornerShape(12.dp))
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    CircularProgressIndicator(color = Color(0xFF0284C7), modifier = Modifier.size(32.dp))
                    Text(
                        text = "Procurando computadores na rede local (Porta 45824)...",
                        fontSize = 13.sp,
                        color = Color(0xFF94A3B8)
                    )
                    Button(
                        onClick = { isManualDialogVisible = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155))
                    ) {
                        Text("Conectar por IP Manual")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(discoveredHosts) { host ->
                    HostCard(host = host, onSelect = { onConnect(host) })
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Barra inferior de controle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = keepScreenOn,
                    onCheckedChange = onKeepScreenOnChange,
                    colors = CheckboxDefaults.colors(checkedColor = Color(0xFF0284C7))
                )
                Text("Manter tela sempre acesa", color = Color(0xFFE2E8F0), fontSize = 12.sp)
            }

            TextButton(onClick = { isManualDialogVisible = true }) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Inserir IP Manual", color = Color(0xFF38BDF8), fontSize = 12.sp)
            }
        }
    }

    if (isManualDialogVisible) {
        AlertDialog(
            onDismissRequest = { isManualDialogVisible = false },
            title = { Text("Conexão Manual por IP") },
            text = {
                OutlinedTextField(
                    value = manualIp,
                    onValueChange = { manualIp = it },
                    label = { Text("Endereço IP do Computador") },
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        isManualDialogVisible = false
                        onConnect(DiscoveredHost("manual", "PC Manual", manualIp.trim(), 45820))
                    }
                ) {
                    Text("Conectar")
                }
            },
            dismissButton = {
                TextButton(onClick = { isManualDialogVisible = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun HostCard(host: DiscoveredHost, onSelect: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFF0284C7).copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Laptop, contentDescription = null, tint = Color(0xFF38BDF8))
                }
                Column {
                    Text(text = host.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                    Text(text = "${host.ip}:${host.port}", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
            }

            Button(
                onClick = onSelect,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
            ) {
                Text("Conectar")
            }
        }
    }
}
